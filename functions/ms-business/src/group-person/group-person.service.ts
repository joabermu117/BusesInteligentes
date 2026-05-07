import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { Group } from '../group/entities/group.entity';
import { CreateGroupPersonDto } from './dto/create-group-person.dto';
import { UpdateGroupPersonDto } from './dto/update-group-person.dto';
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
  ) {}

  async create(createGroupPersonDto: CreateGroupPersonDto): Promise<GroupPerson> {
    const group = await this.groupRepository.findOne({
      where: { id: createGroupPersonDto.group_id },
    });
    if (!group) {
      throw new NotFoundException(`Group #${createGroupPersonDto.group_id} not found`);
    }

    const person = await this.citizenRepository.findOne({
      where: { person_id: createGroupPersonDto.person_id },
    });
    if (!person) {
      throw new NotFoundException(`Citizen #${createGroupPersonDto.person_id} not found`);
    }

    const groupPerson = this.groupPersonRepository.create({
      ...createGroupPersonDto,
      group,
      person,
    });

    return await this.groupPersonRepository.save(groupPerson);
  }

  async findAll(): Promise<GroupPerson[]> {
    return await this.groupPersonRepository.find({
      relations: ['group', 'person'],
    });
  }

  async findByGroup(group_id: number): Promise<GroupPerson[]> {
    return await this.groupPersonRepository.find({
      where: { group_id },
      relations: ['person'],
    });
  }

  async findOne(group_id: number, person_id: string): Promise<GroupPerson> {
    const groupPerson = await this.groupPersonRepository.findOne({
      where: { group_id, person_id },
      relations: ['group', 'person'],
    });

    if (!groupPerson) {
      throw new NotFoundException(
        `GroupPerson group_id=${group_id}, person_id=${person_id} not found`,
      );
    }

    return groupPerson;
  }

  async update(
    group_id: number,
    person_id: string,
    updateGroupPersonDto: UpdateGroupPersonDto,
  ): Promise<GroupPerson> {
    const groupPerson = await this.findOne(group_id, person_id);

    if (updateGroupPersonDto.group_id !== undefined) {
      const group = await this.groupRepository.findOne({
        where: { id: updateGroupPersonDto.group_id },
      });
      if (!group) {
        throw new NotFoundException(`Group #${updateGroupPersonDto.group_id} not found`);
      }
      groupPerson.group = group;
      groupPerson.group_id = group.id!;
    }

    if (updateGroupPersonDto.person_id !== undefined) {
      const person = await this.citizenRepository.findOne({
        where: { person_id: updateGroupPersonDto.person_id },
      });
      if (!person) {
        throw new NotFoundException(`Citizen #${updateGroupPersonDto.person_id} not found`);
      }
      groupPerson.person = person;
      groupPerson.person_id = person.person_id;
    }

    Object.assign(groupPerson, updateGroupPersonDto);
    return await this.groupPersonRepository.save(groupPerson);
  }

  async remove(group_id: number, person_id: string): Promise<{ message: string }> {
    const groupPerson = await this.findOne(group_id, person_id);
    await this.groupPersonRepository.remove(groupPerson);
    return {
      message: `GroupPerson group_id=${group_id}, person_id=${person_id} deleted successfully`,
    };
  }
}
