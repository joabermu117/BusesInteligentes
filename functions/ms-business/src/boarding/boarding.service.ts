import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BoardBusDto } from './dto/board-bus.dto';
import { AlightBusDto } from './dto/alight-bus.dto';
import { ValidatePaymentDto } from './dto/validate-payment.dto';
import { Ticket } from '../ticket/entities/ticket.entity';
import { History } from '../history/entities/history.entity';
import { Citizen } from '../citizen/entities/citizen.entity';
import { CitizenPaymentMethod } from '../citizen-payment-method/entities/citizen-payment-method.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Route } from '../route/entities/route.entity';
import {
  canBoardSchedule,
  countActivePassengers,
  isPrepaidMethod,
  TicketStatus,
  ScheduleStatus,
} from '../common/boarding-rules';
import { SIMULATED_PREPAID_BALANCE } from '../common/enums';

@Injectable()
export class BoardingService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(CitizenPaymentMethod)
    private readonly citizenPaymentMethodRepository: Repository<CitizenPaymentMethod>,
    @InjectRepository(History)
    private readonly historyRepository: Repository<History>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
  ) {}

  async boardBus(dto: BoardBusDto) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id: dto.scheduleId },
      relations: ['bus', 'tickets'],
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule #${dto.scheduleId} no encontrado`);
    }

    if (!canBoardSchedule(schedule.status!)) {
      throw new BadRequestException(
        `El schedule no está disponible (estado: ${schedule.status})`,
      );
    }

    const activeCount = countActivePassengers(schedule.tickets);
    const busCapacity = schedule.bus?.totalCapacity ?? 0;
    if (activeCount >= busCapacity) {
      throw new BadRequestException('El bus está lleno');
    }

    const citizen = await this.citizenRepository.findOne({
      where: { person_id: dto.citizenId },
    });
    if (!citizen) {
      throw new NotFoundException(`Ciudadano ${dto.citizenId} no encontrado`);
    }

    const paymentMethod = await this.citizenPaymentMethodRepository.findOne({
      where: { id: dto.paymentMethodId },
      relations: ['citizen', 'paymentMethod'],
    });
    if (!paymentMethod) {
      throw new NotFoundException(
        `Método de pago #${dto.paymentMethodId} no encontrado`,
      );
    }
    if (paymentMethod.citizen?.person_id !== dto.citizenId) {
      throw new BadRequestException(
        'El método de pago no pertenece al ciudadano',
      );
    }

    const route = await this.routeRepository.findOne({
      where: { id: schedule.routeId },
    });
    const price = route?.tarifa ?? 0;

    const methodName = paymentMethod.paymentMethod?.name;
    const isPrepaid = isPrepaidMethod(methodName);
    let remainingBalance = 0;

    if (isPrepaid) {
      remainingBalance = SIMULATED_PREPAID_BALANCE - price;
      if (remainingBalance < 0) {
        throw new BadRequestException(
          `Saldo insuficiente. Disponible: S/ ${SIMULATED_PREPAID_BALANCE.toFixed(2)}, Tarifa: S/ ${price.toFixed(2)}`,
        );
      }
    }

    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const ticket = this.ticketRepository.create({
      ticketNumber,
      status: TicketStatus.ISSUED,
      issuedDate: new Date(),
      price,
      isBoardingPass: true,
      citizen,
      schedule,
      paymentMethod,
    });
    await this.ticketRepository.save(ticket);

    const savedTicket = await this.ticketRepository.findOne({
      where: { id: ticket.id },
      relations: ['citizen', 'schedule', 'schedule.bus', 'paymentMethod', 'paymentMethod.paymentMethod'],
    });
    if (!savedTicket) {
      throw new NotFoundException('Error al recuperar el ticket creado');
    }

    const history = this.historyRepository.create({
      personId: dto.citizenId,
      action: 'boarded',
      timestamp: new Date(),
      nodeId: dto.stopId.toString(),
      details: `Abordaje en paradero #${dto.stopId}`,
      ticket: { id: savedTicket.id } as Ticket,
    });
    await this.historyRepository.save(history);

    return {
      message: 'Abordaje exitoso',
      ticket: savedTicket,
      remainingBalance,
    };
  }

  async alightBus(dto: AlightBusDto) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: dto.ticketId, status: TicketStatus.ISSUED },
      relations: ['citizen', 'schedule', 'schedule.bus', 'history'],
    });
    if (!ticket) {
      throw new NotFoundException('Boleto activo no encontrado');
    }

    if (ticket.citizen?.person_id !== dto.citizenId) {
      throw new BadRequestException(
        'Este boleto no pertenece al ciudadano solicitante',
      );
    }

    if (ticket.schedule?.status !== ScheduleStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'El viaje asociado a este boleto ya no está activo',
      );
    }

    ticket.status = TicketStatus.USED;
    ticket.completedDate = new Date();
    await this.ticketRepository.save(ticket);

    const history = this.historyRepository.create({
      personId: ticket.citizen?.person_id ?? '',
      action: 'validated',
      timestamp: new Date(),
      nodeId: dto.stopId.toString(),
      details: 'Descenso en paradero',
      ticket,
    });
    await this.historyRepository.save(history);

    return {
      message: 'Viaje completado - Gracias por usar nuestro servicio',
      ticket,
    };
  }

  async validatePaymentMethod(dto: ValidatePaymentDto) {
    const paymentMethod = await this.citizenPaymentMethodRepository.findOne({
      where: { id: dto.paymentMethodId },
      relations: ['citizen', 'paymentMethod'],
    });

    if (!paymentMethod || paymentMethod.citizen?.person_id !== dto.citizenId) {
      return { valid: false };
    }

    return {
      valid: true,
      balance: isPrepaidMethod(paymentMethod.paymentMethod?.name)
        ? SIMULATED_PREPAID_BALANCE
        : 0,
    };
  }
}
