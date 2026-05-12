import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CitizenPaymentMethod } from '../citizen-payment-method/entities/citizen-payment-method.entity';
import { Citizen } from '../citizen/entities/citizen.entity';
import { ShiftStatus } from '../common/enums';
import { History } from '../history/entities/history.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Shift } from '../shifts/entities/shift.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(CitizenPaymentMethod)
    private readonly citizenPaymentMethodRepository: Repository<CitizenPaymentMethod>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
  ) {}

  async create(createTicketDto: CreateTicketDto): Promise<Ticket> {
    const citizen = await this.citizenRepository.findOne({
      where: { person_id: createTicketDto.citizenId.toString() },
    });
    if (!citizen) {
      throw new NotFoundException(
        `Citizen #${createTicketDto.citizenId} not found`,
      );
    }

    const schedule = await this.scheduleRepository.findOne({
      where: { id: createTicketDto.scheduleId },
    });
    if (!schedule) {
      throw new NotFoundException(
        `Schedule #${createTicketDto.scheduleId} not found`,
      );
    }

    let paymentMethod: CitizenPaymentMethod | null = null;
    if (createTicketDto.paymentMethodId) {
      paymentMethod = await this.citizenPaymentMethodRepository.findOne({
        where: { id: createTicketDto.paymentMethodId },
      });
      if (!paymentMethod) {
        throw new NotFoundException(
          `Payment method #${createTicketDto.paymentMethodId} not found`,
        );
      }
    }

    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const ticket = this.ticketRepository.create({
      ...createTicketDto,
      ticketNumber,
      citizen,
      schedule,
      paymentMethod: paymentMethod ?? undefined,
    });
    return await this.ticketRepository.save(ticket);
  }

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      relations: [
        'citizen',
        'paymentMethod',
        'schedule',
        'schedule.bus',
        'history',
      ],
    });
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: [
        'citizen',
        'paymentMethod',
        'schedule',
        'schedule.bus',
        'history',
      ],
    });
    if (!ticket) throw new NotFoundException(`Ticket #${id} not found`);
    return ticket;
  }

  async findByCitizen(citizenId: number): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { citizen: { person_id: citizenId.toString() } },
      relations: [
        'citizen',
        'paymentMethod',
        'schedule',
        'schedule.bus',
        'history',
      ],
    });
  }

  async findByPerson(personId: string): Promise<Ticket[]> {
    return await this.ticketRepository.find({
      where: { citizen: { person_id: personId } },
      relations: ['schedule', 'schedule.bus', 'history'],
      order: { issuedDate: 'DESC' },
    });
  }

  async findTravelDetail(id: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: [
        'citizen',
        'schedule',
        'schedule.bus',
        'schedule.bus.gps',
        'history',
      ],
    });
    if (!ticket) throw new NotFoundException(`Ticket #${id} not found`);

    // Buscar turno activo del bus para obtener información del conductor
    const driverInfo: {
      person_id: string;
      licenseNumber?: string;
      driverUserId?: string;
    } | null = ticket.schedule?.bus?.id
      ? await (async () => {
          const activeShift = await this.shiftRepository.findOne({
            where: {
              bus: { id: ticket.schedule!.bus!.id! },
              status: ShiftStatus.IN_PROGRESS,
            },
            relations: ['driver'],
          });
          return activeShift?.driver
            ? {
                person_id: activeShift.driver.person_id,
                licenseNumber: activeShift.driver.licenseNumber,
                driverUserId: activeShift.driverUserId,
              }
            : null;
        })()
      : null;

    return {
      ...ticket,
      driver: driverInfo,
    };
  }

  async update(id: number, updateTicketDto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);
    const updated = Object.assign(ticket, updateTicketDto);
    return await this.ticketRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const ticket = await this.findOne(id);
    await this.ticketRepository.remove(ticket);
    return { message: `Ticket #${id} deleted successfully` };
  }
}
