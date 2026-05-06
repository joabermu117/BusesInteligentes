import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { Stop } from './entities/stop.entity';

@Injectable()
export class StopService {
  constructor(
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
  ) {}

  async create(createStopDto: CreateStopDto): Promise<Stop> {
    const stop = this.stopRepository.create(createStopDto);
    return await this.stopRepository.save(stop);
  }

  async findAll(): Promise<Stop[]> {
    return await this.stopRepository.find({ relations: ['routeStops', 'routeStops.route'] });
  }

  async findOne(id: number): Promise<Stop> {
    const stop = await this.stopRepository.findOne({
      where: { id },
      relations: ['routeStops', 'routeStops.route'],
    });
    if (!stop) {
      throw new NotFoundException(`Stop #${id} not found`);
    }
    return stop;
  }

  async update(id: number, updateStopDto: UpdateStopDto): Promise<Stop> {
    const stop = await this.findOne(id);
    Object.assign(stop, updateStopDto);
    return await this.stopRepository.save(stop);
  }

  async remove(id: number): Promise<{ message: string }> {
    const stop = await this.findOne(id);
    await this.stopRepository.remove(stop);
    return { message: `Stop #${id} deleted successfully` };
  }
}
