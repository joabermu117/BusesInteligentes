import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Gps } from './entities/gps.entity';
import { CreateGpsDto } from './dto/create-gps.dto';
import { UpdateGpsDto } from './dto/update-gps.dto';
import { Bus } from '../buses/entities/bus.entity';

@Injectable()
export class GpsService {
  constructor(
    @InjectRepository(Gps)
    private readonly gpsRepository: Repository<Gps>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
  ) {}

  async create(createGpsDto: CreateGpsDto): Promise<Gps> {
    const bus = await this.busRepository.findOne({
      where: { id: createGpsDto.busId },
      relations: ['gps'],
    });
    if (!bus) throw new NotFoundException(`Bus #${createGpsDto.busId} not found`);
    if (bus.gps) {
      throw new BadRequestException(`Bus #${createGpsDto.busId} already has a GPS unit`);
    }

    const gps = this.gpsRepository.create({ ...createGpsDto, bus });
    return await this.gpsRepository.save(gps);
  }

  async findAll(): Promise<Gps[]> {
    return await this.gpsRepository.find({ relations: ['bus'] });
  }

  async findOne(id: number): Promise<Gps> {
    const gps = await this.gpsRepository.findOne({
      where: { id },
      relations: ['bus'],
    });
    if (!gps) throw new NotFoundException(`GPS #${id} not found`);
    return gps;
  }

  async findByBus(busId: number): Promise<Gps> {
    const gps = await this.gpsRepository.findOne({
      where: { bus: { id: busId } },
      relations: ['bus'],
    });
    if (!gps) throw new NotFoundException(`GPS for bus #${busId} not found`);
    return gps;
  }

  async update(id: number, updateGpsDto: UpdateGpsDto): Promise<Gps> {
    const gps = await this.findOne(id);
    const updated = Object.assign(gps, { ...updateGpsDto, lastUpdate: new Date() });
    return await this.gpsRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const gps = await this.findOne(id);
    await this.gpsRepository.remove(gps);
    return { message: `GPS #${id} deleted successfully` };
  }
}