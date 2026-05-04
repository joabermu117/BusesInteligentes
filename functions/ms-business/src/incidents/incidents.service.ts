import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from './entities/incident.entity';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentRepository: Repository<Incident>,
  ) {}

  async create(createIncidentDto: CreateIncidentDto): Promise<Incident> {
    const incident = this.incidentRepository.create({
      ...createIncidentDto,
      reportedAt: new Date(),
    });
    return await this.incidentRepository.save(incident);
  }

  async findAll(): Promise<Incident[]> {
    return await this.incidentRepository.find({
      relations: ['incidentBuses', 'incidentBuses.bus'],
    });
  }

  async findOne(id: number): Promise<Incident> {
    const incident = await this.incidentRepository.findOne({
      where: { id },
      relations: ['incidentBuses', 'incidentBuses.bus', 'incidentBuses.photos'],
    });
    if (!incident) throw new NotFoundException(`Incident #${id} not found`);
    return incident;
  }

  async findByType(type: string): Promise<Incident[]> {
    return await this.incidentRepository.find({
      where: { type },
      relations: ['incidentBuses', 'incidentBuses.bus'],
    });
  }

  async findByStatus(status: string): Promise<Incident[]> {
    return await this.incidentRepository.find({
      where: { status },
      relations: ['incidentBuses', 'incidentBuses.bus'],
    });
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto): Promise<Incident> {
    const incident = await this.findOne(id);

    // Si se resuelve, registrar fecha de resolución
    if (updateIncidentDto.status === 'resolved' && !incident.resolvedAt) {
      updateIncidentDto['resolvedAt'] = new Date() as any;
    }

    const updated = Object.assign(incident, updateIncidentDto);
    return await this.incidentRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const incident = await this.findOne(id);
    await this.incidentRepository.remove(incident);
    return { message: `Incident #${id} deleted successfully` };
  }
}