import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncidentBus } from './entities/incident-bus.entity';
import { CreateIncidentBusDto } from './dto/create-incident-bus.dto';
import { UpdateIncidentBusDto } from './dto/update-incident-bus.dto';
import { Bus } from '../buses/entities/bus.entity';
import { Incident } from '../incidents/entities/incident.entity';

@Injectable()
export class IncidentsBusesService {
  constructor(
    @InjectRepository(IncidentBus)
    private readonly incidentBusRepository: Repository<IncidentBus>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async create(createIncidentBusDto: CreateIncidentBusDto): Promise<IncidentBus> {
    const bus = await this.busRepository.findOne({
      where: { id: createIncidentBusDto.busId },
    });
    if (!bus) throw new NotFoundException(`Bus #${createIncidentBusDto.busId} not found`);

    const incident = await this.incidentRepository.findOne({
      where: { id: createIncidentBusDto.incidentId },
    });
    if (!incident) throw new NotFoundException(`Incident #${createIncidentBusDto.incidentId} not found`);

    const incidentBus = this.incidentBusRepository.create({
      ...createIncidentBusDto,
      bus,
      incident,
      reportedAt: new Date(),
    });
    return await this.incidentBusRepository.save(incidentBus);
  }

  async findAll(): Promise<IncidentBus[]> {
    return await this.incidentBusRepository.find({
      relations: ['bus', 'incident', 'photos'],
    });
  }

  async findOne(id: number): Promise<IncidentBus> {
    const incidentBus = await this.incidentBusRepository.findOne({
      where: { id },
      relations: ['bus', 'incident', 'photos'],
    });
    if (!incidentBus) throw new NotFoundException(`IncidentBus #${id} not found`);
    return incidentBus;
  }

  async findByBus(busId: number): Promise<IncidentBus[]> {
    return await this.incidentBusRepository.find({
      where: { bus: { id: busId } },
      relations: ['bus', 'incident', 'photos'],
      order: { reportedAt: 'DESC' },
    });
  }

  async update(id: number, updateIncidentBusDto: UpdateIncidentBusDto): Promise<IncidentBus> {
    const incidentBus = await this.findOne(id);
    const updated = Object.assign(incidentBus, updateIncidentBusDto);
    return await this.incidentBusRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const incidentBus = await this.findOne(id);
    await this.incidentBusRepository.remove(incidentBus);
    return { message: `IncidentBus #${id} deleted successfully` };
  }
}