import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../ticket/entities/ticket.entity';
import { CreateHistoryDto } from './dto/create-history.dto';
import { UpdateHistoryDto } from './dto/update-history.dto';
import { History } from './entities/history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
  ) {}

  async create(createHistoryDto: CreateHistoryDto): Promise<History> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: createHistoryDto.ticketId },
    });
    if (!ticket) {
      throw new NotFoundException(`Ticket #${createHistoryDto.ticketId} not found`);
    }

    const history = this.historyRepository.create({
      ...createHistoryDto,
      ticket,
      timestamp: new Date(),
    });
    return await this.historyRepository.save(history);
  }

  async findAll(): Promise<History[]> {
    return await this.historyRepository.find({
      relations: ['ticket'],
    });
  }

  async findOne(id: number): Promise<History> {
    const history = await this.historyRepository.findOne({
      where: { id },
      relations: ['ticket'],
    });
    if (!history) throw new NotFoundException(`History #${id} not found`);
    return history;
  }

  async findByTicket(ticketId: number): Promise<History[]> {
    return await this.historyRepository.find({
      where: { ticket: { id: ticketId } },
      relations: ['ticket'],
      order: { timestamp: 'DESC' },
    });
  }

  async findByPerson(personId: string): Promise<History[]> {
    return await this.historyRepository.find({
      where: { personId },
      relations: ['ticket'],
      order: { timestamp: 'DESC' },
    });
  }

  async update(id: number, updateHistoryDto: UpdateHistoryDto): Promise<History> {
    const history = await this.findOne(id);
    const updated = Object.assign(history, updateHistoryDto);
    return await this.historyRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const history = await this.findOne(id);
    await this.historyRepository.remove(history);
    return { message: `History #${id} deleted successfully` };
  }
}
