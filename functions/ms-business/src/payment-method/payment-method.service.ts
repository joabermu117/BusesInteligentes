import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethod } from './entities/payment-method.entity';

@Injectable()
export class PaymentMethodService {
  constructor(
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto): Promise<PaymentMethod> {
    const existing = await this.paymentMethodRepository.findOne({
      where: { name: createPaymentMethodDto.name },
    });
    if (existing) {
      throw new BadRequestException(
        `Payment method ${createPaymentMethodDto.name} already exists`,
      );
    }

    const paymentMethod = this.paymentMethodRepository.create(createPaymentMethodDto);
    return await this.paymentMethodRepository.save(paymentMethod);
  }

  async findAll(): Promise<PaymentMethod[]> {
    return await this.paymentMethodRepository.find({
      relations: ['citizenPaymentMethods'],
    });
  }

  async findOne(id: number): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id },
      relations: ['citizenPaymentMethods'],
    });
    if (!paymentMethod) throw new NotFoundException(`Payment method #${id} not found`);
    return paymentMethod;
  }

  async update(id: number, updatePaymentMethodDto: UpdatePaymentMethodDto): Promise<PaymentMethod> {
    const paymentMethod = await this.findOne(id);
    const updated = Object.assign(paymentMethod, updatePaymentMethodDto);
    return await this.paymentMethodRepository.save(updated);
  }

  async remove(id: number): Promise<{ message: string }> {
    const paymentMethod = await this.findOne(id);
    await this.paymentMethodRepository.remove(paymentMethod);
    return { message: `Payment method #${id} deleted successfully` };
  }
}
