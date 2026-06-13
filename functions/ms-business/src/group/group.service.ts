import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group } from './entities/group.entity';
import { GroupPerson } from '../group-person/entities/group-person.entity';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(GroupPerson)
    private readonly groupPersonRepository: Repository<GroupPerson>,
  ) {}

  async create(createGroupDto: CreateGroupDto): Promise<Group> {
    const createdBy = await this.citizenRepository.findOne({
      where: { person_id: createGroupDto.created_by_person_id },
    });
    if (!createdBy) throw new NotFoundException(`Citizen not found`);

    const group = this.groupRepository.create({
      ...createGroupDto,
      is_public: createGroupDto.is_public ?? true,
      created_by: createdBy,
    });
    const savedGroup = await this.groupRepository.save(group);

    await this.groupPersonRepository.save(
      this.groupPersonRepository.create({
        group_id: savedGroup.id!,
        person_id: createGroupDto.created_by_person_id,
        role: 'admin',
      }),
    );

    return savedGroup;
  }

  async findAll(): Promise<Group[]> {
    return await this.groupRepository.find({
      relations: ['created_by', 'groupPersons'],
    });
  }

  async findPublic(search?: string): Promise<Group[]> {
    if (search) {
      return await this.groupRepository.find({
        where: [
          { is_public: true, name: Like(`%${search}%`) },
          { is_public: true, description: Like(`%${search}%`) },
        ],
        relations: ['groupPersons'],
        order: { created_at: 'DESC' },
      });
    }
    return await this.groupRepository.find({
      where: { is_public: true },
      relations: ['groupPersons'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['created_by', 'groupPersons', 'groupPersons.person'],
    });
    if (!group) throw new NotFoundException(`Group #${id} not found`);
    return group;
  }

  async update(id: number, updateGroupDto: UpdateGroupDto): Promise<Group> {
    const group = await this.findOne(id);
    if (updateGroupDto.created_by_person_id) {
      const createdBy = await this.citizenRepository.findOne({
        where: { person_id: updateGroupDto.created_by_person_id },
      });
      if (!createdBy) throw new NotFoundException(`Citizen not found`);
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