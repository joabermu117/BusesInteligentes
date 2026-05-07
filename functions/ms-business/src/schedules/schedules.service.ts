import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Bus } from '../buses/entities/bus.entity';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const bus = await this.busRepository.findOne({
      where: { id: createScheduleDto.busId },
    });
    if (!bus) throw new NotFoundException(`Bus #${createScheduleDto.busId} not found`);

    // Verificar que el bus no tenga otra programación activa en el mismo horario
    const departureTime = new Date(createScheduleDto.departureTime!);
    const windowStart = new Date(departureTime.getTime() - 60 * 60 * 1000);
    const windowEnd = new Date(departureTime.getTime() + 60 * 60 * 1000);

    const conflict = await this.scheduleRepository.findOne({
      where: {
        bus: { id: createScheduleDto.busId },
        status: 'scheduled',
        departureTime: Between(windowStart, windowEnd),
      },
    });
    if (conflict) {
      throw new BadRequestException(
        `Bus #${createScheduleDto.busId} already has a schedule in that time window`,
      );
    }

    const schedule = this.scheduleRepository.create({
      ...createScheduleDto,
      departureTime,
      date: createScheduleDto.date ? new Date(createScheduleDto.date) : undefined,
      bus,
    });
    return await this.scheduleRepository.save(schedule);
  }

  async findAll(): Promise<Schedule[]> {
    return await this.scheduleRepository.find({
      relations: ['bus', 'bus.company', 'tickets'],
    });
  }

  async findOne(id: number): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['bus', 'bus.company'],
    });
    if (!schedule) throw new NotFoundException(`Schedule #${id} not found`);
    return schedule;
  }

  async findByBus(busId: number): Promise<Schedule[]> {
    return await this.scheduleRepository.find({
      where: { bus: { id: busId } },
      relations: ['bus'],
      order: { departureTime: 'ASC' },
    });
  }

  async findByRoute(routeId: number): Promise<Schedule[]> {
    return await this.scheduleRepository.find({
      where: { routeId },
      relations: ['bus', 'bus.company'],
      order: { departureTime: 'ASC' },
    });
  }

  async update(id: number, updateScheduleDto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findOne(id);
    const updated = Object.assign(schedule, {
      ...updateScheduleDto,
      departureTime: updateScheduleDto.departureTime
        ? new Date(updateScheduleDto.departureTime)
        : schedule.departureTime,
    });
    return await this.scheduleRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const schedule = await this.findOne(id);
    if (schedule.status === 'in_progress') {
      throw new BadRequestException(
        'Cannot delete a schedule that is in progress',
      );
    }
    await this.scheduleRepository.remove(schedule);
    return { message: `Schedule #${id} deleted successfully` };
  }
}