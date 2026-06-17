import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { Group } from '../group/entities/group.entity';
import { NotificationsGateway } from '../gateways/notifications/notifications.gateway';
import { FcmService } from '../notifications-fcm/fcm.service';
import { CreateGroupPersonDto } from './dto/create-group-person.dto';
import { UpdateGroupPersonDto } from './dto/update-group-person.dto';
import { GroupMembershipLog } from './entities/group-membership-log.entity';
import { GroupPerson } from './entities/group-person.entity';

@Injectable()
export class GroupPersonService {
  constructor(
    @InjectRepository(GroupPerson)
    private readonly groupPersonRepository: Repository<GroupPerson>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(GroupMembershipLog)
    private readonly logRepository: Repository<GroupMembershipLog>,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly fcmService: FcmService,
  ) {}

  private async log(
    group_id: number,
    person_id: string,
    action: string,
    action_by?: string,
  ) {
    await this.logRepository.save(
      this.logRepository.create({ group_id, person_id, action, action_by_person_id: action_by }),
    );
  }

  async addByAdmin(
    groupId: number,
    personId: string,
    actionBy: string,
  ): Promise<GroupPerson> {
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException(`Group #${groupId} not found`);

    // Verificar que quien agrega es admin del grupo
    const adminMember = await this.groupPersonRepository.findOne({
      where: { group_id: groupId, person_id: actionBy, role: 'admin' },
    });
    if (!adminMember) {
      throw new BadRequestException('Solo los administradores pueden agregar miembros');
    }

    const person = await this.citizenRepository.findOne({ where: { person_id: personId } });
    if (!person) throw new NotFoundException(`Citizen #${personId} not found`);

    // Verificar si ya es miembro o está bloqueado
    const existing = await this.groupPersonRepository.findOne({
      where: { group_id: groupId, person_id: personId },
    });
    if (existing?.is_blocked) {
      throw new BadRequestException('Este usuario está bloqueado y no puede unirse al grupo');
    }
    if (existing) {
      throw new BadRequestException('El usuario ya es miembro del grupo');
    }

    const groupPerson = this.groupPersonRepository.create({
      group_id: groupId,
      person_id: personId,
      role: 'member',
      group,
      person,
    });
    const saved = await this.groupPersonRepository.save(groupPerson);
    await this.log(groupId, personId, 'joined', actionBy);

    const actor = await this.citizenRepository.findOne({ where: { person_id: actionBy } });
    this.notifyAddedToGroup(group, personId, actor?.name);

    return saved;
  }

  private notifyAddedToGroup(group: Group, personId: string, addedByName?: string | null): void {
    this.notificationsGateway.sendToUser(personId, 'added-to-group', {
      groupId: group.id,
      groupName: group.name,
      addedByName,
    });

    this.fcmService.sendPushToUser(
      personId,
      'Te agregaron a un grupo',
      `${addedByName ?? 'Un administrador'} te agregó al grupo "${group.name}"`,
      { type: 'group-added', groupId: String(group.id) },
    );
  }

  async create(dto: CreateGroupPersonDto): Promise<GroupPerson> {
    const group = await this.groupRepository.findOne({ where: { id: dto.group_id } });
    if (!group) throw new NotFoundException(`Group #${dto.group_id} not found`);

    const person = await this.citizenRepository.findOne({ where: { person_id: dto.person_id } });
    if (!person) throw new NotFoundException(`Citizen #${dto.person_id} not found`);

    // Verificar si está bloqueado
    const existing = await this.groupPersonRepository.findOne({
      where: { group_id: dto.group_id, person_id: dto.person_id },
    });
    if (existing?.is_blocked) {
      throw new BadRequestException('Este usuario está bloqueado y no puede unirse al grupo');
    }
    if (existing) {
      throw new BadRequestException('El usuario ya es miembro del grupo');
    }

    const groupPerson = this.groupPersonRepository.create({ ...dto, group, person });
    const saved = await this.groupPersonRepository.save(groupPerson);
    await this.log(dto.group_id!, dto.person_id!, 'joined', dto.person_id!);
    return saved;
  }

  async findAll(): Promise<GroupPerson[]> {
    return await this.groupPersonRepository.find({ relations: ['group', 'person'] });
  }

  async findByGroup(group_id: number): Promise<GroupPerson[]> {
    return await this.groupPersonRepository.find({
      where: { group_id },
      relations: ['person'],
      order: { joined_at: 'ASC' },
    });
  }

  async findOne(group_id: number, person_id: string): Promise<GroupPerson> {
    const gp = await this.groupPersonRepository.findOne({
      where: { group_id, person_id },
      relations: ['group', 'person'],
    });
    if (!gp) throw new NotFoundException(`Member not found`);
    return gp;
  }

  async update(group_id: number, person_id: string, dto: UpdateGroupPersonDto): Promise<GroupPerson> {
    const gp = await this.findOne(group_id, person_id);
    Object.assign(gp, dto);
    return await this.groupPersonRepository.save(gp);
  }

  async promote(group_id: number, person_id: string, action_by: string): Promise<GroupPerson> {
    const gp = await this.findOne(group_id, person_id);
    gp.role = 'admin';
    const saved = await this.groupPersonRepository.save(gp);
    await this.log(group_id, person_id, 'promoted', action_by);
    return saved;
  }

  async block(group_id: number, person_id: string, action_by: string): Promise<{ message: string }> {
    const gp = await this.findOne(group_id, person_id);

    gp.is_blocked = true;
    await this.groupPersonRepository.save(gp);

    await this.groupPersonRepository.remove(gp);

    const blocked = this.groupPersonRepository.create({
      group_id,
      person_id,
      is_blocked: true,
      role: 'member',
    });
    await this.groupPersonRepository.save(blocked);

    await this.log(group_id, person_id, 'blocked', action_by);
    return { message: `User ${person_id} blocked from group ${group_id}` };
  }

  async remove(group_id: number, person_id: string, action_by?: string): Promise<{ message: string }> {
    const gp = await this.findOne(group_id, person_id);
    const action = action_by === person_id ? 'left' : 'removed';
    await this.groupPersonRepository.remove(gp);
    await this.log(group_id, person_id, action, action_by ?? person_id);
    return { message: `Member removed from group` };
  }

  async getMembershipLog(group_id: number): Promise<GroupMembershipLog[]> {
    return await this.logRepository.find({
      where: { group_id },
      order: { action_at: 'DESC' },
    });
  }
}