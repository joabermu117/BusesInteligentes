import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const existing = await this.companyRepository.findOne({
      where: { nit: createCompanyDto.nit },
    });
    if (existing) {
      throw new BadRequestException(
        `Ya existe una empresa con NIT ${createCompanyDto.nit}`,
      );
    }
    const company = this.companyRepository.create(createCompanyDto);
    return await this.companyRepository.save(company);
  }

  async findAll(): Promise<Company[]> {
    return await this.companyRepository.find({ relations: ['buses'] });
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['buses'],
    });
    if (!company) throw new NotFoundException(`Empresa #${id} no encontrada`);
    return company;
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findOne(id);
    const updated = Object.assign(company, updateCompanyDto);
    return await this.companyRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const company = await this.findOne(id);
    if (company.buses && company.buses.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar la empresa porque tiene buses asociados',
      );
    }
    await this.companyRepository.remove(company);
    return { message: `Empresa #${id} eliminada correctamente` };
  }
}