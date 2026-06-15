import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { Message } from '../message/entities/message.entity';
import { CreateRecipientPersonDto } from './dto/create-recipient-person.dto';
import { UpdateRecipientPersonDto } from './dto/update-recipient-person.dto';
import { RecipientPerson } from './entities/recipient-person.entity';

@Injectable()
export class RecipientPersonService {
  constructor(
    @InjectRepository(RecipientPerson)
    private readonly recipientPersonRepository: Repository<RecipientPerson>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
  ) {}

  async create(createRecipientPersonDto: CreateRecipientPersonDto): Promise<RecipientPerson> {
    const message = await this.messageRepository.findOne({
      where: { id: createRecipientPersonDto.message_id },
    });
    if (!message) {
      throw new NotFoundException(`Message #${createRecipientPersonDto.message_id} not found`);
    }

    const recipient = await this.citizenRepository.findOne({
      where: { person_id: createRecipientPersonDto.recipient_person_id },
    });
    if (!recipient) {
      throw new NotFoundException(
        `Citizen #${createRecipientPersonDto.recipient_person_id} not found`,
      );
    }

    const recipientPerson = this.recipientPersonRepository.create({
      ...createRecipientPersonDto,
      message,
      recipient,
    });

    return await this.recipientPersonRepository.save(recipientPerson);
  }

  async findAll(): Promise<RecipientPerson[]> {
    return await this.recipientPersonRepository.find({
      relations: ['message', 'recipient'],
    });
  }

  async findOne(id: number): Promise<RecipientPerson> {
    const recipientPerson = await this.recipientPersonRepository.findOne({
      where: { id },
      relations: ['message', 'recipient'],
    });

    if (!recipientPerson) {
      throw new NotFoundException(`RecipientPerson #${id} not found`);
    }

    return recipientPerson;
  }

  async update(
    id: number,
    updateRecipientPersonDto: UpdateRecipientPersonDto,
  ): Promise<RecipientPerson> {
    const recipientPerson = await this.findOne(id);

    if (updateRecipientPersonDto.message_id !== undefined) {
      const message = await this.messageRepository.findOne({
        where: { id: updateRecipientPersonDto.message_id },
      });
      if (!message) {
        throw new NotFoundException(`Message #${updateRecipientPersonDto.message_id} not found`);
      }
      recipientPerson.message = message;
      recipientPerson.message_id = message.id;
    }

    if (updateRecipientPersonDto.recipient_person_id !== undefined) {
      const recipient = await this.citizenRepository.findOne({
        where: { person_id: updateRecipientPersonDto.recipient_person_id },
      });
      if (!recipient) {
        throw new NotFoundException(
          `Citizen #${updateRecipientPersonDto.recipient_person_id} not found`,
        );
      }
      recipientPerson.recipient = recipient;
      recipientPerson.recipient_person_id = recipient.person_id;
    }

    Object.assign(recipientPerson, updateRecipientPersonDto);
    return await this.recipientPersonRepository.save(recipientPerson);
  }

  async markAsRead(id: number): Promise<RecipientPerson> {
    const rp = await this.findOne(id);
    rp.read_at = rp.read_at ?? new Date();
    return this.recipientPersonRepository.save(rp);
  }

  async remove(id: number): Promise<{ message: string }> {
    const recipientPerson = await this.findOne(id);
    await this.recipientPersonRepository.remove(recipientPerson);
    return { message: `RecipientPerson #${id} deleted successfully` };
  }
}
