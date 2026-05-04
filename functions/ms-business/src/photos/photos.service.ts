import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Photo } from './entities/photo.entity';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { IncidentBus } from '../incidents-buses/entities/incident-bus.entity';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(IncidentBus)
    private readonly incidentBusRepository: Repository<IncidentBus>,
  ) {}

  async create(createPhotoDto: CreatePhotoDto): Promise<Photo> {
    const incidentBus = await this.incidentBusRepository.findOne({
      where: { id: createPhotoDto.incidentBusId },
      relations: ['photos'],
    });
    if (!incidentBus) {
      throw new NotFoundException(
        `IncidentBus #${createPhotoDto.incidentBusId} not found`,
      );
    }

    // Máximo 5 fotos por incidente según HU-ENTR-2-007
    if (incidentBus.photos && incidentBus.photos.length >= 5) {
      throw new BadRequestException(
        'Maximum 5 photos allowed per incident report',
      );
    }

    const photo = this.photoRepository.create({
      ...createPhotoDto,
      incidentBus,
      uploadedAt: new Date(),
    });
    return await this.photoRepository.save(photo);
  }

  async findAll(): Promise<Photo[]> {
    return await this.photoRepository.find({
      relations: ['incidentBus'],
    });
  }

  async findOne(id: number): Promise<Photo> {
    const photo = await this.photoRepository.findOne({
      where: { id },
      relations: ['incidentBus'],
    });
    if (!photo) throw new NotFoundException(`Photo #${id} not found`);
    return photo;
  }

  async findByIncidentBus(incidentBusId: number): Promise<Photo[]> {
    return await this.photoRepository.find({
      where: { incidentBus: { id: incidentBusId } },
      relations: ['incidentBus'],
      order: { uploadedAt: 'DESC' },
    });
  }

  async update(id: number, updatePhotoDto: UpdatePhotoDto): Promise<Photo> {
    const photo = await this.findOne(id);
    const updated = Object.assign(photo, updatePhotoDto);
    return await this.photoRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const photo = await this.findOne(id);
    await this.photoRepository.remove(photo);
    return { message: `Photo #${id} deleted successfully` };
  }
}