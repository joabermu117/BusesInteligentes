import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { Driver } from './entities/driver.entity';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
  ) {}

  async create(createDriverDto: CreateDriverDto): Promise<Driver> {
    const existing = await this.driverRepository.findOne({
      where: { person_id: createDriverDto.person_id },
    });
    if (existing) {
      throw new BadRequestException(
        `Driver with person_id ${createDriverDto.person_id} already exists`,
      );
    }

    const driver = this.driverRepository.create(createDriverDto);
    return await this.driverRepository.save(driver);
  }

  async findAll(): Promise<Driver[]> {
    return await this.driverRepository.find({
      relations: ['shifts', 'contracts'],
    });
  }

  async findOne(person_id: string): Promise<Driver> {
    const driver = await this.driverRepository.findOne({
      where: { person_id },
      relations: ['shifts', 'contracts'],
    });
    if (!driver) throw new NotFoundException(`Driver #${person_id} not found`);
    return driver;
  }

  async update(person_id: string, updateDriverDto: UpdateDriverDto): Promise<Driver> {
    const driver = await this.findOne(person_id);
    const updated = Object.assign(driver, updateDriverDto);
    return await this.driverRepository.save(updated);
  }

  async remove(person_id: string): Promise<{ message: string }> {
    const driver = await this.findOne(person_id);
    await this.driverRepository.remove(driver);
    return { message: `Driver #${person_id} deleted successfully` };
  }
}
