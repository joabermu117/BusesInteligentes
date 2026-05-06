import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { Message } from './entities/message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
  ) {}

  async create(createMessageDto: CreateMessageDto): Promise<Message> {
    const sender = await this.citizenRepository.findOne({
      where: { person_id: createMessageDto.sender_person_id },
    });

    if (!sender) {
      throw new NotFoundException(
        `Citizen #${createMessageDto.sender_person_id} not found`,
      );
    }

    const message = this.messageRepository.create({
      ...createMessageDto,
      sender,
    });

    return await this.messageRepository.save(message);
  }

  async findAll(): Promise<Message[]> {
    return await this.messageRepository.find({
      relations: ['sender', 'recipientPersons', 'recipientGroups'],
    });
  }

  async findOne(id: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['sender', 'recipientPersons', 'recipientGroups'],
    });

    if (!message) {
      throw new NotFoundException(`Message #${id} not found`);
    }

    return message;
  }

  async update(id: number, updateMessageDto: UpdateMessageDto): Promise<Message> {
    const message = await this.findOne(id);

    if (updateMessageDto.sender_person_id !== undefined) {
      const sender = await this.citizenRepository.findOne({
        where: { person_id: updateMessageDto.sender_person_id },
      });
      if (!sender) {
        throw new NotFoundException(
          `Citizen #${updateMessageDto.sender_person_id} not found`,
        );
      }
      message.sender = sender;
      message.sender_person_id = sender.person_id;
    }

    Object.assign(message, updateMessageDto);
    return await this.messageRepository.save(message);
  }

  async remove(id: number): Promise<{ message: string }> {
    const message = await this.findOne(id);
    await this.messageRepository.remove(message);
    return { message: `Message #${id} deleted successfully` };
  }
}
