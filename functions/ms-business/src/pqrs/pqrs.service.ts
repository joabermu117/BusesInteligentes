import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePqrsDto, UpdatePqrsEstadoDto } from './dto/create-pqrs.dto';
import { Pqrs } from './entities/pqrs.entity';

@Injectable()
export class PqrsService {
  constructor(
    @InjectRepository(Pqrs)
    private readonly pqrsRepository: Repository<Pqrs>,
  ) {}

  async create(dto: CreatePqrsDto): Promise<Pqrs> {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 900000) + 100000;
    const radicado = `PQRS-${year}-${random}`;

    // Deadline: 5 días hábiles (~7 días calendario)
    const deadlineAt = new Date(now);
    deadlineAt.setDate(deadlineAt.getDate() + 7);

    const pqrs = this.pqrsRepository.create({
    radicado,
    tipo: dto.tipo,
    categoria: dto.categoria,
    descripcion: dto.descripcion,
    email: dto.email,
    estado: 'recibido',
    fotos: dto.fotos ? JSON.stringify(dto.fotos) : undefined,
    tiempoRespuesta: '5 días hábiles',
    deadlineAt,
  });

    return await this.pqrsRepository.save(pqrs);
  }

  async findByRadicado(radicado: string): Promise<Pqrs> {
    const pqrs = await this.pqrsRepository.findOne({ where: { radicado } });
    if (!pqrs) throw new NotFoundException(`PQRS ${radicado} no encontrado`);
    return pqrs;
  }

  async findAll(): Promise<Pqrs[]> {
    return await this.pqrsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async updateEstado(radicado: string, dto: UpdatePqrsEstadoDto): Promise<Pqrs> {
    const pqrs = await this.findByRadicado(radicado);
    pqrs.estado = dto.estado;
    if (dto.respuesta) pqrs.respuesta = dto.respuesta;
    if (dto.estado === 'resuelto') pqrs.resolvedAt = new Date();
    return await this.pqrsRepository.save(pqrs);
  }

  async findVencidos(): Promise<Pqrs[]> {
    const now = new Date();
    return await this.pqrsRepository
      .createQueryBuilder('pqrs')
      .where('pqrs.deadlineAt < :now', { now })
      .andWhere('pqrs.estado != :estado', { estado: 'resuelto' })
      .getMany();
  }
}