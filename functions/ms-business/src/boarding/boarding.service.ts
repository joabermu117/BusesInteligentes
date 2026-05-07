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
    // 1. Obtener el Schedule con relaciones a Bus y tickets
    const schedule = await this.scheduleRepository.findOne({
      where: { id: dto.scheduleId },
      relations: ['bus', 'tickets'],
    });
    if (!schedule) {
      throw new NotFoundException(`Schedule #${dto.scheduleId} no encontrado`);
    }

    // 2. Validar que el Schedule tenga estado in_progress o scheduled
    if (schedule.status !== 'in_progress' && schedule.status !== 'scheduled') {
      throw new BadRequestException(
        `El schedule no está disponible (estado: ${schedule.status})`,
      );
    }

    // 3. Verificar capacidad
    const activeTicketsCount = schedule.tickets?.filter(
      (t) => t.status === 'issued' || t.status === 'used',
    ).length ?? 0;
    const busCapacity = schedule.bus?.totalCapacity ?? 0;
    if (activeTicketsCount >= busCapacity) {
      throw new BadRequestException('El bus está lleno');
    }

    // 4. Verificar que el ciudadano exista
    const citizen = await this.citizenRepository.findOne({
      where: { person_id: dto.citizenId },
    });
    if (!citizen) {
      throw new NotFoundException(`Ciudadano ${dto.citizenId} no encontrado`);
    }

    // 5. Verificar que el método de pago exista y pertenezca al ciudadano
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

    // 6-7. Simular validación de saldo y descuento de tarifa (MVP)
    // Obtener tarifa desde la ruta
    const route = await this.routeRepository.findOne({
      where: { id: schedule.routeId },
    });
    const price = route?.tarifa ?? 0;

    // 8. Generar el Ticket
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const ticket = this.ticketRepository.create({
      ticketNumber,
      status: 'issued',
      issuedDate: new Date(),
      price,
      isBoardingPass: true,
      citizen,
      schedule,
      paymentMethod,
    });
    await this.ticketRepository.save(ticket);

    // Recargar ticket con relaciones para devolver datos completos
    const savedTicket = await this.ticketRepository.findOne({
      where: { id: ticket.id },
      relations: ['citizen', 'schedule', 'schedule.bus', 'paymentMethod', 'paymentMethod.paymentMethod'],
    });
    if (!savedTicket) {
      throw new NotFoundException('Error al recuperar el ticket creado');
    }

    // 9. Registrar historia de abordaje
    const history = this.historyRepository.create({
      personId: dto.citizenId,
      action: 'boarded',
      timestamp: new Date(),
      nodeId: dto.stopId.toString(),
      details: `Abordaje en paradero #${dto.stopId}`,
      ticket: { id: savedTicket.id } as Ticket,
    });
    await this.historyRepository.save(history);

    // 10. Devolver respuesta
    return {
      message: 'Abordaje exitoso',
      ticket: savedTicket,
      remainingBalance: 0,
    };
  }

  async alightBus(dto: AlightBusDto) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: dto.ticketId, status: 'issued' },
      relations: ['citizen', 'history'],
    });
    if (!ticket) {
      throw new NotFoundException('Boleto activo no encontrado');
    }

    // Actualizar ticket
    ticket.status = 'used';
    ticket.completedDate = new Date();
    await this.ticketRepository.save(ticket);

    // Registrar historia de descenso
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
      relations: ['citizen'],
    });

    if (!paymentMethod || paymentMethod.citizen?.person_id !== dto.citizenId) {
      return { valid: false };
    }

    return { valid: true, balance: 0 };
  }
}
