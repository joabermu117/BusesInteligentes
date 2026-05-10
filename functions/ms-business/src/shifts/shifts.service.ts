import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { Bus } from '../buses/entities/bus.entity';
import { Driver } from '../driver/entities/driver.entity';
import { CreateShiftDto } from './dto/create-shift.dto';
import { StartShiftDto } from './dto/start-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { Shift } from './entities/shift.entity';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async create(createShiftDto: CreateShiftDto): Promise<Shift> {
    const bus = await this.busRepository.findOne({
      where: { id: createShiftDto.busId },
    });
    if (!bus)
      throw new NotFoundException(`Bus #${createShiftDto.busId} not found`);

    const activeShift = await this.shiftRepository.findOne({
      where: { bus: { id: createShiftDto.busId }, status: 'in_progress' },
    });
    if (activeShift) {
      throw new BadRequestException(
        `Bus #${createShiftDto.busId} already has an active shift`,
      );
    }

    const shift = this.shiftRepository.create({
      ...createShiftDto,
      startTime: new Date(createShiftDto.startTime!),
      bus,
    });
    return await this.shiftRepository.save(shift);
  }

  async findAll(): Promise<Shift[]> {
    return await this.shiftRepository.find({
      relations: ['bus', 'driver'],
    });
  }

  async findOne(id: number): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({
      where: { id },
      relations: ['bus', 'driver'],
    });
    if (!shift) throw new NotFoundException(`Shift #${id} not found`);
    return shift;
  }

  async findByBus(busId: number): Promise<Shift[]> {
    return await this.shiftRepository.find({
      where: { bus: { id: busId } },
      relations: ['bus', 'driver'],
    });
  }

  // Buscar turno activo por driverId
  async findActiveByDriver(driverId: number): Promise<Shift | null> {
    return await this.shiftRepository.findOne({
      where: {
        driver: Equal(driverId),
        status: 'in_progress',
      },
      relations: ['bus', 'driver'],
    });
  }

  async findByDriver(driverUserId: string): Promise<Shift[]> {
    return await this.shiftRepository.find({
      where: { driverUserId },
      relations: ['bus', 'driver'],
      order: { startTime: 'DESC' },
    });
  }

  async startShift(shiftId: number, dto: StartShiftDto): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({
      where: { id: shiftId },
      relations: ['bus', 'bus.gps', 'driver'],
    });
    if (!shift) throw new NotFoundException(`Turno #${shiftId} no encontrado`);

    // Validar que sea la fecha/hora correcta (+/- 30 min)
    const now = new Date();
    const shiftStart = new Date(shift.startTime!);
    const diffMinutes = Math.abs(now.getTime() - shiftStart.getTime()) / 60000;
    if (diffMinutes > 30) {
      throw new BadRequestException(
        'El turno no corresponde a la hora actual (+/- 30 min)',
      );
    }

    // Validar estado
    if (shift.status !== 'scheduled') {
      throw new BadRequestException('El turno no está programado');
    }

    // Actualizar con datos del conductor
    shift.status = 'in_progress';
    shift.busCondition = dto.busCondition || shift.busCondition;
    shift.observations = dto.observations || shift.observations;
    shift.startTime = now;

    // Activar GPS del bus
    if (shift.bus?.gps) {
      shift.bus.gps.active = true;
      shift.bus.gps.lastUpdate = now;
    }

    return await this.shiftRepository.save(shift);
  }

  async update(id: number, updateShiftDto: UpdateShiftDto): Promise<Shift> {
    const shift = await this.findOne(id);
    const updated = Object.assign(shift, updateShiftDto);
    return await this.shiftRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const shift = await this.findOne(id);
    if (shift.status === 'in_progress') {
      throw new BadRequestException(
        'Cannot delete a shift that is in progress',
      );
    }
    await this.shiftRepository.remove(shift);
    return { message: `Shift #${id} deleted successfully` };
  }
}
