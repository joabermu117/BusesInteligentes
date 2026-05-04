import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shift } from './entities/shift.entity';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { Bus } from '../buses/entities/bus.entity';

@Injectable()
export class ShiftsService {
  constructor(
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
  ) {}

  async create(createShiftDto: CreateShiftDto): Promise<Shift> {
    const bus = await this.busRepository.findOne({
      where: { id: createShiftDto.busId },
    });
    if (!bus) throw new NotFoundException(`Bus #${createShiftDto.busId} not found`);

    // Verificar que el bus no tenga un turno activo
    const activeShift = await this.shiftRepository.findOne({
      where: { bus: { id: createShiftDto.busId }, status: 'in_progress' },
    });
    if (activeShift) {
      throw new BadRequestException(`Bus #${createShiftDto.busId} already has an active shift`);
    }

    const shift = this.shiftRepository.create({
      ...createShiftDto,
      startTime: new Date(createShiftDto.startTime!),
      bus,
    });
    return await this.shiftRepository.save(shift);
  }

  async findAll(): Promise<Shift[]> {
    return await this.shiftRepository.find({ relations: ['bus'] });
  }

  async findOne(id: number): Promise<Shift> {
    const shift = await this.shiftRepository.findOne({
      where: { id },
      relations: ['bus'],
    });
    if (!shift) throw new NotFoundException(`Shift #${id} not found`);
    return shift;
  }

  async findByBus(busId: number): Promise<Shift[]> {
    return await this.shiftRepository.find({
      where: { bus: { id: busId } },
      relations: ['bus'],
    });
  }

  async findActiveByDriver(driverUserId: string): Promise<Shift | null> {
    return await this.shiftRepository.findOne({
      where: { driverUserId, status: 'in_progress' },
      relations: ['bus'],
    });
  }

  async update(id: number, updateShiftDto: UpdateShiftDto): Promise<Shift> {
    const shift = await this.findOne(id);
    const updated = Object.assign(shift, updateShiftDto);
    return await this.shiftRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const shift = await this.findOne(id);
    if (shift.status === 'in_progress') {
      throw new BadRequestException('Cannot delete a shift that is in progress');
    }
    await this.shiftRepository.remove(shift);
    return { message: `Shift #${id} deleted successfully` };
  }
}