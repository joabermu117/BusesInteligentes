import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { NotificationsGateway } from '../gateways/notifications/notifications.gateway';
import { RecipientPerson } from '../recipient-person/entities/recipient-person.entity';
import { Message } from '../message/entities/message.entity';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Citizen)
    private readonly citizenRepo: Repository<Citizen>,
    @InjectRepository(RecipientPerson)
    private readonly recipientPersonRepo: Repository<RecipientPerson>,
    private readonly dataSource: DataSource,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(dto: CreateAlertDto): Promise<{ message: Message; recipients: number }> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const sender = await qr.manager.findOne(Citizen, {
        where: { person_id: dto.sender_person_id },
      });
      if (!sender) throw new NotFoundException(`Sender ${dto.sender_person_id} not found`);

      const isScheduled = !!dto.scheduled_at;
      const msg = await qr.manager.save(Message,
        qr.manager.create(Message, {
          content: dto.content,
          sender_person_id: dto.sender_person_id,
          sender,
          message_type: 'mass_alert',
          is_urgent: dto.is_urgent ?? false,
          is_readonly: true,
          is_dispatched: !isScheduled,
          scheduled_at: isScheduled ? new Date(dto.scheduled_at!) : undefined,
        }),
      );

      const recipients = await this.resolveRecipients(dto);
      let count = 0;

      for (const citizen of recipients) {
        if (citizen.person_id === dto.sender_person_id) continue;
        await qr.manager.save(RecipientPerson,
          qr.manager.create(RecipientPerson, {
            message_id: msg.id,
            message: msg,
            recipient_person_id: citizen.person_id,
            recipient: citizen,
          }),
        );
        count++;
      }

      await qr.commitTransaction();

      if (!dto.scheduled_at) {
        const recipientIds = recipients
          .map((c) => c.person_id)
          .filter((id) => id !== dto.sender_person_id);

        this.notificationsGateway.sendToMany(recipientIds, 'mass-alert', {
          messageId: msg.id,
          content: msg.content,
          is_urgent: msg.is_urgent,
          senderName: sender.name,
        });

        if (dto.is_urgent) {
          this.notificationsGateway.broadcastNotification({
            type: 'urgent-alert',
            messageId: msg.id,
            content: msg.content,
          });
        }
      }

      return { message: msg, recipients: count };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  private async resolveRecipients(dto: CreateAlertDto): Promise<Citizen[]> {
    if (dto.scope === 'all') {
      return this.citizenRepo.find({ where: { isActive: true } });
    }

    if (dto.scope === 'route') {
      // Próximamente: buscar citizens que hayan viajado en la ruta
      // vía tickets → schedules → routeId
      throw new BadRequestException(
        'El alcance por ruta estará disponible próximamente. Por ahora, use alcance "all".',
      );
    }

    if (dto.scope === 'zone') {
      // Próximamente: requerir coordenadas o zona predefinida
      // para filtrar citizens por ubicación
      throw new BadRequestException(
        'El alcance por zona estará disponible próximamente. Por ahora, use alcance "all".',
      );
    }

    return [];
  }

  async findAll(): Promise<Message[]> {
    return this.messageRepo.find({
      where: { message_type: 'mass_alert' },
      relations: ['sender'],
      order: { sent_at: 'DESC' },
    });
  }

  async getStats(alertId: number): Promise<{
    total: number;
    delivered: number;
    read: number;
  }> {
    const msg = await this.messageRepo.findOne({ where: { id: alertId } });
    if (!msg) throw new NotFoundException(`Alert #${alertId} not found`);

    const [total, read] = await Promise.all([
      this.recipientPersonRepo.count({ where: { message_id: alertId } }),
      this.recipientPersonRepo
        .createQueryBuilder('rp')
        .where('rp.message_id = :id', { id: alertId })
        .andWhere('rp.read_at IS NOT NULL')
        .getCount(),
    ]);

    return { total, delivered: total, read };
  }
}
