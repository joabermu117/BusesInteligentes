import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { PaymentMethod } from '../payment-method/entities/payment-method.entity';
import { CreateCitizenPaymentMethodDto } from './dto/create-citizen-payment-method.dto';
import { UpdateCitizenPaymentMethodDto } from './dto/update-citizen-payment-method.dto';
import { CitizenPaymentMethod } from './entities/citizen-payment-method.entity';

@Injectable()
export class CitizenPaymentMethodService {
  constructor(
    @InjectRepository(CitizenPaymentMethod)
    private readonly citizenPaymentMethodRepository: Repository<CitizenPaymentMethod>,
    @InjectRepository(Citizen)
    private readonly citizenRepository: Repository<Citizen>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(createCitizenPaymentMethodDto: CreateCitizenPaymentMethodDto): Promise<CitizenPaymentMethod> {
    const citizen = await this.citizenRepository.findOne({
      where: { person_id: createCitizenPaymentMethodDto.citizenId.toString() },
    });
    if (!citizen) {
      throw new NotFoundException(`Citizen #${createCitizenPaymentMethodDto.citizenId} not found`);
    }

    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: createCitizenPaymentMethodDto.paymentMethodId },
    });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method #${createCitizenPaymentMethodDto.paymentMethodId} not found`);
    }

    const citizenPaymentMethod = this.citizenPaymentMethodRepository.create({
      ...createCitizenPaymentMethodDto,
      citizen,
      paymentMethod,
    });
    return await this.citizenPaymentMethodRepository.save(citizenPaymentMethod);
  }

  async findAll(): Promise<CitizenPaymentMethod[]> {
    return await this.citizenPaymentMethodRepository.find({
      relations: ['citizen', 'paymentMethod'],
    });
  }

  async findOne(id: number): Promise<CitizenPaymentMethod> {
    const citizenPaymentMethod = await this.citizenPaymentMethodRepository.findOne({
      where: { id },
      relations: ['citizen', 'paymentMethod'],
    });
    if (!citizenPaymentMethod) throw new NotFoundException(`Citizen payment method #${id} not found`);
    return citizenPaymentMethod;
  }

  async findByCitizen(citizenId: string): Promise<CitizenPaymentMethod[]> {
    return await this.citizenPaymentMethodRepository.find({
      where: { citizen: { person_id: citizenId } },
      relations: ['citizen', 'paymentMethod'],
    });
  }

  async update(id: number, updateCitizenPaymentMethodDto: UpdateCitizenPaymentMethodDto): Promise<CitizenPaymentMethod> {
    const citizenPaymentMethod = await this.findOne(id);
    const updated = Object.assign(citizenPaymentMethod, updateCitizenPaymentMethodDto);
    return await this.citizenPaymentMethodRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const citizenPaymentMethod = await this.findOne(id);
    await this.citizenPaymentMethodRepository.remove(citizenPaymentMethod);
    return { message: `Citizen payment method #${id} deleted successfully` };
  }
}
