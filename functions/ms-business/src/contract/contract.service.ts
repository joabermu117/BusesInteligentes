import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import { Driver } from '../driver/entities/driver.entity';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { Contract } from './entities/contract.entity';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private readonly contractRepository: Repository<Contract>,
    @InjectRepository(Driver)
    private readonly driverRepository: Repository<Driver>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createContractDto: CreateContractDto): Promise<Contract> {
    const driver = await this.driverRepository.findOne({
      where: { person_id: createContractDto.person_id },
    });
    if (!driver) {
      throw new NotFoundException(`Driver #${createContractDto.person_id} not found`);
    }

    const company = await this.companyRepository.findOne({
      where: { id: createContractDto.companyId },
    });
    if (!company) {
      throw new NotFoundException(`Company #${createContractDto.companyId} not found`);
    }

    const contract = this.contractRepository.create({
      ...createContractDto,
      driver,
      company,
      startDate: new Date(createContractDto.startDate),
      endDate: createContractDto.endDate ? new Date(createContractDto.endDate) : undefined,
    });
    return await this.contractRepository.save(contract);
  }

  async findAll(): Promise<Contract[]> {
    return await this.contractRepository.find({
      relations: ['driver', 'company'],
    });
  }

  async findOne(id: number): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['driver', 'company'],
    });
    if (!contract) throw new NotFoundException(`Contract #${id} not found`);
    return contract;
  }

  async findByDriver(driverId: string): Promise<Contract[]> {
    return await this.contractRepository.find({
      where: { driver: { person_id: driverId } },
      relations: ['driver', 'company'],
    });
  }

  async findByCompany(companyId: number): Promise<Contract[]> {
    return await this.contractRepository.find({
      where: { company: { id: companyId } },
      relations: ['driver', 'company'],
    });
  }

  async update(id: number, updateContractDto: UpdateContractDto): Promise<Contract> {
    const contract = await this.findOne(id);
    const updated = Object.assign(contract, updateContractDto);
    return await this.contractRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const contract = await this.findOne(id);
    await this.contractRepository.remove(contract);
    return { message: `Contract #${id} deleted successfully` };
  }
}
