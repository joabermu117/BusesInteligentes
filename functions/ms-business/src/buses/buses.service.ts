import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bus } from './entities/bus.entity';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { Company } from '../companies/entities/company.entity';

@Injectable()
export class BusesService {
  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createBusDto: CreateBusDto): Promise<Bus> {
    const existing = await this.busRepository.findOne({
      where: { plate: createBusDto.plate },
    });
    if (existing) {
      throw new BadRequestException(
        `Bus with plate ${createBusDto.plate} already exists`,
      );
    }

    const company = await this.companyRepository.findOne({
      where: { id: createBusDto.companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company #${createBusDto.companyId} not found`);
    }

    // Generar QR único basado en la placa
    const qrCode = `BUS-${createBusDto.plate}-${Date.now()}`;

    const bus = this.busRepository.create({
      ...createBusDto,
      company,
      qrCode,
    });
    return await this.busRepository.save(bus);
  }

  async findAll(): Promise<Bus[]> {
    return await this.busRepository.find({
      relations: ['company', 'gps'],
    });
  }

  async findOne(id: number): Promise<Bus> {
    const bus = await this.busRepository.findOne({
      where: { id },
      relations: ['company', 'gps', 'shifts', 'incidentBuses', 'schedules'],
    });
    if (!bus) throw new NotFoundException(`Bus #${id} not found`);
    return bus;
  }

  async findByCompany(companyId: number): Promise<Bus[]> {
    return await this.busRepository.find({
      where: { company: { id: companyId } },
      relations: ['company', 'gps'],
    });
  }

  async update(id: number, updateBusDto: UpdateBusDto): Promise<Bus> {
    const bus = await this.findOne(id);
    const updated = Object.assign(bus, updateBusDto);
    return await this.busRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const bus = await this.findOne(id);
    if (bus.shifts && bus.shifts.length > 0) {
      throw new BadRequestException(
        'Cannot delete bus because it has associated shifts',
      );
    }
    await this.busRepository.remove(bus);
    return { message: `Bus #${id} deleted successfully` };
  }
}