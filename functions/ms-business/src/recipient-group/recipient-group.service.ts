import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../group/entities/group.entity';
import { Message } from '../message/entities/message.entity';
import { CreateRecipientGroupDto } from './dto/create-recipient-group.dto';
import { UpdateRecipientGroupDto } from './dto/update-recipient-group.dto';
import { RecipientGroup } from './entities/recipient-group.entity';

@Injectable()
export class RecipientGroupService {
  constructor(
    @InjectRepository(RecipientGroup)
    private readonly recipientGroupRepository: Repository<RecipientGroup>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
  ) {}

  async create(createRecipientGroupDto: CreateRecipientGroupDto): Promise<RecipientGroup> {
    const message = await this.messageRepository.findOne({
      where: { id: createRecipientGroupDto.message_id },
    });
    if (!message) {
      throw new NotFoundException(`Message #${createRecipientGroupDto.message_id} not found`);
    }

    const group = await this.groupRepository.findOne({
      where: { id: createRecipientGroupDto.group_id },
    });
    if (!group) {
      throw new NotFoundException(`Group #${createRecipientGroupDto.group_id} not found`);
    }

    const recipientGroup = this.recipientGroupRepository.create({
      ...createRecipientGroupDto,
      message,
      group,
    });

    return await this.recipientGroupRepository.save(recipientGroup);
  }

  async findAll(): Promise<RecipientGroup[]> {
    return await this.recipientGroupRepository.find({
      relations: ['message', 'group'],
    });
  }

  async findOne(id: number): Promise<RecipientGroup> {
    const recipientGroup = await this.recipientGroupRepository.findOne({
      where: { id },
      relations: ['message', 'group'],
    });

    if (!recipientGroup) {
      throw new NotFoundException(`RecipientGroup #${id} not found`);
    }

    return recipientGroup;
  }

  async update(
    id: number,
    updateRecipientGroupDto: UpdateRecipientGroupDto,
  ): Promise<RecipientGroup> {
    const recipientGroup = await this.findOne(id);

    if (updateRecipientGroupDto.message_id !== undefined) {
      const message = await this.messageRepository.findOne({
        where: { id: updateRecipientGroupDto.message_id },
      });
      if (!message) {
        throw new NotFoundException(`Message #${updateRecipientGroupDto.message_id} not found`);
      }
      recipientGroup.message = message;
      recipientGroup.message_id = message.id;
    }

    if (updateRecipientGroupDto.group_id !== undefined) {
      const group = await this.groupRepository.findOne({
        where: { id: updateRecipientGroupDto.group_id },
      });
      if (!group) {
        throw new NotFoundException(`Group #${updateRecipientGroupDto.group_id} not found`);
      }
      recipientGroup.group = group;
      recipientGroup.group_id = group.id;
    }

    Object.assign(recipientGroup, updateRecipientGroupDto);
    return await this.recipientGroupRepository.save(recipientGroup);
  }

  async remove(id: number): Promise<{ message: string }> {
    const recipientGroup = await this.findOne(id);
    await this.recipientGroupRepository.remove(recipientGroup);
    return { message: `RecipientGroup #${id} deleted successfully` };
  }
}
