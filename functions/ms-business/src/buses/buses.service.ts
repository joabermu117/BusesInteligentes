import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { Gps } from '../gps/entities/gps.entity';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { Bus } from './entities/bus.entity';

@Injectable()
export class BusesService {
  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  private validateCapacity(dto: CreateBusDto | UpdateBusDto): void {
    const seated = dto.seatedCapacity ?? 0;
    const standing = dto.standingCapacity ?? 0;
    const total = seated + standing;
    if (dto.totalCapacity !== undefined && total > dto.totalCapacity) {
      throw new BadRequestException(
        `La suma de personas sentadas (${seated}) y paradas (${standing}) es ${total}, pero la capacidad máxima es ${dto.totalCapacity}. ` +
          `Reduce los valores para que no excedan la capacidad total.`,
      );
    }
  }

  async create(createBusDto: CreateBusDto): Promise<Bus> {
    const existing = await this.busRepository.findOne({
      where: { plate: createBusDto.plate },
    });
    if (existing) {
      throw new BadRequestException(
        `Ya existe un bus con la placa ${createBusDto.plate}`,
      );
    }

    const company = await this.companyRepository.findOne({
      where: { id: createBusDto.companyId },
    });
    if (!company) {
      throw new NotFoundException(
        `Empresa #${createBusDto.companyId} no encontrada`,
      );
    }

    this.validateCapacity(createBusDto);

    // Compatibilidad: si envían photoUrl lo mapeamos a photo
    if (createBusDto.photoUrl && !createBusDto.photo) {
      (createBusDto as Record<string, unknown>).photo = createBusDto.photoUrl;
    }

    // Crear GPS con ubicacion por defecto en Manizales
    const gps = new Gps();
    gps.latitude = 5.031077;
    gps.longitude = -75.452459;
    gps.active = true;
    gps.lastUpdate = new Date();

    const bus = this.busRepository.create({
      ...createBusDto,
      company,
      gps,
    });
    const saved = await this.busRepository.save(bus);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    saved.qrCode = `${frontendUrl}/buses/${saved.id}`;
    return await this.busRepository.save(saved);
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
    if (!bus) throw new NotFoundException(`Bus #${id} no encontrado`);
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
    this.validateCapacity(updateBusDto);
    // Verificar placa única si se está cambiando
    if (updateBusDto.plate && updateBusDto.plate !== bus.plate) {
      const existing = await this.busRepository.findOne({
        where: { plate: updateBusDto.plate },
      });
      if (existing) {
        throw new BadRequestException(
          `Ya existe un bus con la placa ${updateBusDto.plate}`,
        );
      }
    }
    // Compatibilidad: si envían photoUrl lo mapeamos a photo
    if (updateBusDto.photoUrl && !updateBusDto.photo) {
      (updateBusDto as Record<string, unknown>).photo = updateBusDto.photoUrl;
    }
    const updated = Object.assign(bus, updateBusDto);
    return await this.busRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const bus = await this.findOne(id);
    if (bus.shifts && bus.shifts.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar el bus porque tiene turnos asociados',
      );
    }
    await this.busRepository.remove(bus);
    return { message: `Bus #${id} eliminado correctamente` };
  }
}
