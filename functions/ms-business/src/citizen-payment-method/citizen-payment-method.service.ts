import { Injectable } from '@nestjs/common';
import { CreateCitizenPaymentMethodDto } from './dto/create-citizen-payment-method.dto';
import { UpdateCitizenPaymentMethodDto } from './dto/update-citizen-payment-method.dto';

@Injectable()
export class CitizenPaymentMethodService {
  create(createCitizenPaymentMethodDto: CreateCitizenPaymentMethodDto) {
    return 'This action adds a new citizenPaymentMethod';
  }

  findAll() {
    return `This action returns all citizenPaymentMethod`;
  }

  findOne(id: number) {
    return `This action returns a #${id} citizenPaymentMethod`;
  }

  update(id: number, updateCitizenPaymentMethodDto: UpdateCitizenPaymentMethodDto) {
    return `This action updates a #${id} citizenPaymentMethod`;
  }

  remove(id: number) {
    return `This action removes a #${id} citizenPaymentMethod`;
  }
}
