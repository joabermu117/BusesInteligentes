import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { GroupMessageRead } from '../group-message-read/entities/group-message-read.entity';
import { GroupPerson } from '../group-person/entities/group-person.entity';
import { Group } from '../group/entities/group.entity';
import { NotificationsGateway } from '../gateways/notifications/notifications.gateway';
import { RecipientGroup } from '../recipient-group/entities/recipient-group.entity';
import { RecipientPerson } from '../recipient-person/entities/recipient-person.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';
import { SendPersonalMessageDto } from './dto/send-personal-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Citizen)
    private readonly citizenRepo: Repository<Citizen>,
    @InjectRepository(RecipientPerson)
    private readonly recipientPersonRepo: Repository<RecipientPerson>,
    @InjectRepository(RecipientGroup)
    private readonly recipientGroupRepo: Repository<RecipientGroup>,
    @InjectRepository(GroupPerson)
    private readonly groupPersonRepo: Repository<GroupPerson>,
    @InjectRepository(Group)
    private readonly groupRepo: Repository<Group>,
    @InjectRepository(GroupMessageRead)
    private readonly groupReadRepo: Repository<GroupMessageRead>,
    private readonly dataSource: DataSource,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // ─── Basic CRUD ──────────────────────────────────────────────────────────────

  async create(dto: CreateMessageDto): Promise<Message> {
    const sender = await this.citizenRepo.findOne({
      where: { person_id: dto.sender_person_id },
    });
    if (!sender) throw new NotFoundException(`Citizen #${dto.sender_person_id} not found`);

    const message = this.messageRepo.create({ ...dto, sender });
    return this.messageRepo.save(message);
  }

  async findAll(): Promise<Message[]> {
    return this.messageRepo.find({
      relations: ['sender', 'recipientPersons', 'recipientGroups'],
    });
  }

  async findOne(id: number): Promise<Message> {
    const msg = await this.messageRepo.findOne({
      where: { id },
      relations: ['sender', 'recipientPersons', 'recipientGroups'],
    });
    if (!msg) throw new NotFoundException(`Message #${id} not found`);
    return msg;
  }

  async update(id: number, dto: UpdateMessageDto): Promise<Message> {
    const msg = await this.findOne(id);
    if (dto.sender_person_id) {
      const sender = await this.citizenRepo.findOne({
        where: { person_id: dto.sender_person_id },
      });
      if (!sender) throw new NotFoundException(`Citizen #${dto.sender_person_id} not found`);
      msg.sender = sender;
      msg.sender_person_id = sender.person_id;
    }
    Object.assign(msg, dto);
    return this.messageRepo.save(msg);
  }

  async remove(id: number): Promise<{ message: string }> {
    const msg = await this.findOne(id);
    await this.messageRepo.remove(msg);
    return { message: `Message #${id} deleted successfully` };
  }

  // ─── Envío personal (transaccional) ──────────────────────────────────────────

  async sendPersonal(dto: SendPersonalMessageDto): Promise<Message> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const sender = await qr.manager.findOne(Citizen, {
        where: { person_id: dto.sender_person_id },
      });
      if (!sender) throw new NotFoundException(`Sender ${dto.sender_person_id} not found`);

      const msg = await qr.manager.save(Message,
        qr.manager.create(Message, {
          content: dto.content,
          sender_person_id: dto.sender_person_id,
          sender,
          message_type: 'personal',
          latitude: dto.latitude,
          longitude: dto.longitude,
          is_urgent: dto.is_urgent ?? false,
        }),
      );

      for (const recipientId of dto.recipient_person_ids) {
        const recipient = await qr.manager.findOne(Citizen, {
          where: { person_id: recipientId },
        });
        if (!recipient) throw new NotFoundException(`Recipient ${recipientId} not found`);

        await qr.manager.save(RecipientPerson,
          qr.manager.create(RecipientPerson, {
            message_id: msg.id,
            message: msg,
            recipient_person_id: recipientId,
            recipient,
          }),
        );

        this.notificationsGateway.sendToUser(recipientId, 'new-message', {
          type: 'personal',
          messageId: msg.id,
          senderName: sender.name,
          preview: msg.content?.substring(0, 100),
          is_urgent: msg.is_urgent,
        });
      }

      await qr.commitTransaction();
      return msg;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ─── Envío grupal (transaccional) ────────────────────────────────────────────

  async sendToGroup(dto: SendGroupMessageDto): Promise<Message> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const sender = await qr.manager.findOne(Citizen, {
        where: { person_id: dto.sender_person_id },
      });
      if (!sender) throw new NotFoundException(`Sender ${dto.sender_person_id} not found`);

      const msg = await qr.manager.save(Message,
        qr.manager.create(Message, {
          content: dto.content,
          sender_person_id: dto.sender_person_id,
          sender,
          message_type: 'group',
          is_urgent: dto.is_urgent ?? false,
        }),
      );

      for (const groupId of dto.group_ids) {
        const group = await qr.manager.findOne(Group, { where: { id: groupId } });
        if (!group) throw new NotFoundException(`Group #${groupId} not found`);

        await qr.manager.save(RecipientGroup,
          qr.manager.create(RecipientGroup, {
            message_id: msg.id,
            message: msg,
            group_id: groupId,
            group,
            delivered_at: new Date(),
          }),
        );

        // Marcar como leído por el remitente
        await qr.manager.save(GroupMessageRead,
          qr.manager.create(GroupMessageRead, {
            message_id: msg.id,
            group_id: groupId,
            person_id: dto.sender_person_id,
            read_at: new Date(),
          }),
        );

        // Notificar a todos los miembros activos del grupo
        const members = await qr.manager.find(GroupPerson, {
          where: { group_id: groupId, is_blocked: false },
        });
        const memberIds = members
          .map((m) => m.person_id!)
          .filter((id) => id !== dto.sender_person_id);

        this.notificationsGateway.sendToMany(memberIds, 'new-group-message', {
          type: 'group',
          messageId: msg.id,
          groupId,
          groupName: group.name,
          senderName: sender.name,
          preview: msg.content?.substring(0, 100),
          is_urgent: msg.is_urgent,
        });
      }

      await qr.commitTransaction();
      return msg;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  // ─── Bandeja de entrada ───────────────────────────────────────────────────────

  async getInbox(
    personId: string,
    type?: string,
    unreadOnly = false,
    page = 1,
    limit = 50,
  ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    const results: any[] = [];

    if (!type || type === 'personal') {
      const qb = this.recipientPersonRepo
        .createQueryBuilder('rp')
        .innerJoinAndSelect('rp.message', 'msg')
        .innerJoinAndSelect('msg.sender', 'sender')
        .where('rp.recipient_person_id = :personId', { personId });

      if (unreadOnly) qb.andWhere('rp.read_at IS NULL');
      qb.orderBy('msg.sent_at', 'DESC');

      const personal = await qb.getMany();
      results.push(
        ...personal.map((rp) => ({
          inbox_type: 'personal' as const,
          recipient_id: rp.id,
          read_at: rp.read_at ?? null,
          message: {
            ...rp.message,
            content_preview: rp.message?.content?.substring(0, 100),
          },
        })),
      );
    }

    if (!type || type === 'group') {
      const memberGroups = await this.groupPersonRepo.find({
        where: { person_id: personId, is_blocked: false },
      });
      const groupIds = memberGroups.map((gp) => gp.group_id!).filter(Boolean);

      if (groupIds.length > 0) {
        const recipGroups = await this.recipientGroupRepo
          .createQueryBuilder('rg')
          .innerJoinAndSelect('rg.message', 'msg')
          .innerJoinAndSelect('msg.sender', 'sender')
          .innerJoinAndSelect('rg.group', 'grp')
          .where('rg.group_id IN (:...groupIds)', { groupIds })
          .orderBy('msg.sent_at', 'DESC')
          .getMany();

        for (const rg of recipGroups) {
          const readRecord = await this.groupReadRepo.findOne({
            where: {
              message_id: rg.message_id,
              group_id: rg.group_id,
              person_id: personId,
            },
          });

          if (unreadOnly && readRecord?.read_at) continue;

          results.push({
            inbox_type: 'group' as const,
            group: rg.group,
            read_at: readRecord?.read_at ?? null,
            group_read_id: readRecord?.id ?? null,
            message: {
              ...rg.message,
              content_preview: rg.message?.content?.substring(0, 100),
            },
          });
        }
      }
    }

    results.sort(
      (a, b) =>
        new Date(b.message.sent_at).getTime() -
        new Date(a.message.sent_at).getTime(),
    );

    const total = results.length;
    const offset = (page - 1) * limit;
    const paged = results.slice(offset, offset + limit);

    return { items: paged, total, page, limit };
  }

  // ─── Mensajes enviados ────────────────────────────────────────────────────────

  async getSent(personId: string): Promise<Message[]> {
    return this.messageRepo.find({
      where: { sender_person_id: personId },
      relations: ['recipientPersons', 'recipientPersons.recipient', 'recipientGroups', 'recipientGroups.group'],
      order: { sent_at: 'DESC' },
    });
  }

  // ─── Contador de no leídos ────────────────────────────────────────────────────

  async getUnreadCount(personId: string): Promise<{ total: number; personal: number; group: number }> {
    const personal = await this.recipientPersonRepo.count({
      where: { recipient_person_id: personId, read_at: IsNull() },
    });

    const memberGroups = await this.groupPersonRepo.find({
      where: { person_id: personId, is_blocked: false },
    });
    const groupIds = memberGroups.map((gp) => gp.group_id!).filter(Boolean);

    let group = 0;
    if (groupIds.length > 0) {
      const recipGroups = await this.recipientGroupRepo.find({
        where: { group_id: In(groupIds) },
        select: ['message_id', 'group_id'],
      });

      for (const rg of recipGroups) {
        const read = await this.groupReadRepo.findOne({
          where: {
            message_id: rg.message_id,
            group_id: rg.group_id,
            person_id: personId,
          },
        });
        if (!read?.read_at) group++;
      }
    }

    return { total: personal + group, personal, group };
  }

  // ─── Recibos de lectura de mensaje grupal ─────────────────────────────────────

  async getReadReceipts(messageId: number): Promise<GroupMessageRead[]> {
    return this.groupReadRepo.find({
      where: { message_id: messageId },
      relations: ['person'],
    });
  }

  // ─── Marcar lectura grupal ────────────────────────────────────────────────────

  async markGroupMessageRead(messageId: number, groupId: number, personId: string): Promise<GroupMessageRead> {
    let record = await this.groupReadRepo.findOne({
      where: { message_id: messageId, group_id: groupId, person_id: personId },
    });

    if (!record) {
      record = this.groupReadRepo.create({
        message_id: messageId,
        group_id: groupId,
        person_id: personId,
        read_at: new Date(),
      });
    } else {
      record.read_at = new Date();
    }

    return this.groupReadRepo.save(record);
  }
}
