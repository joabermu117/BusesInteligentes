import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './entities/group.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
  ) {}

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const createdBy = await this.citizenRepository.findOne({
      where: { person_id: createGroupDto.created_by_person_id },
    });

    if (!createdBy) {
      throw new NotFoundException(`Citizen #${createGroupDto.created_by_person_id} not found`);
    }

    const group = this.groupRepository.create({
      ...createGroupDto,
      created_by: createdBy,
    });

    return await this.groupRepository.save(group);
  }

  async findAll(): Promise<Group[]> {
    return await this.groupRepository.find({
      relations: ['created_by', 'groupPersons', 'recipientGroups'],
    });
  }

  async findOne(id: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['created_by', 'groupPersons', 'recipientGroups'],
    });

    if (!group) {
      throw new NotFoundException(`Group #${id} not found`);
    }

    return group;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);

    if (updateGroupDto.created_by_person_id !== undefined) {
      const createdBy = await this.citizenRepository.findOne({
        where: { person_id: updateGroupDto.created_by_person_id },
      });
      if (!createdBy) {
        throw new NotFoundException(
          `Citizen #${updateGroupDto.created_by_person_id} not found`,
        );
      }
      group.created_by = createdBy;
      group.created_by_person_id = createdBy.person_id;
    }

    Object.assign(group, updateGroupDto);
    return await this.groupRepository.save(group);
  }

  async remove(id: number): Promise<{ message: string }> {
    const group = await this.findOne(id);
    await this.groupRepository.remove(group);
    return { message: `Group #${id} deleted successfully` };
  }
}
