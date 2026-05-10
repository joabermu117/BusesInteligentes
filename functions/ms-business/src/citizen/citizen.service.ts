import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { Citizen } from './entities/citizen.entity';

@Injectable()
export class CitizenService {
  constructor(
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
  ) {}

  async create(createCitizenDto: CreateCitizenDto): Promise<Citizen> {
    const existing = await this.citizenRepository.findOne({
      where: { person_id: createCitizenDto.person_id },
    });
    if (existing) {
      throw new BadRequestException(
        `Citizen with person_id ${createCitizenDto.person_id} already exists`,
      );
    }

    const citizen = this.citizenRepository.create({
      ...createCitizenDto,
      isActive: true,
    });
    return await this.citizenRepository.save(citizen);
  }

  async activate(person_id: string): Promise<Citizen> {
    let citizen = await this.citizenRepository.findOne({
      where: { person_id },
    });
    if (!citizen) {
      citizen = this.citizenRepository.create({ person_id, isActive: true });
      return await this.citizenRepository.save(citizen);
    }
    citizen.isActive = true;
    return await this.citizenRepository.save(citizen);
  }

  async deactivate(person_id: string): Promise<Citizen> {
    const citizen = await this.findOne(person_id);
    citizen.isActive = false;
    return await this.citizenRepository.save(citizen);
  }

  async findAll(): Promise<Citizen[]> {
    return await this.citizenRepository.find({
      relations: ['addresses', 'tickets', 'paymentMethods'],
    });
  }

  async findOne(person_id: string): Promise<Citizen> {
    const citizen = await this.citizenRepository.findOne({
      where: { person_id },
      relations: ['addresses', 'tickets', 'paymentMethods'],
    });
    if (!citizen)
      throw new NotFoundException(`Citizen #${person_id} not found`);
    return citizen;
  }

  async update(
    person_id: string,
    updateCitizenDto: UpdateCitizenDto,
  ): Promise<Citizen> {
    const citizen = await this.findOne(person_id);
    const updated = Object.assign(citizen, updateCitizenDto);
    return await this.citizenRepository.save(updated);
  }

  async remove(person_id: string): Promise<{ message: string }> {
    const citizen = await this.findOne(person_id);
    await this.citizenRepository.remove(citizen);
    return { message: `Citizen #${person_id} deleted successfully` };
  }
}
