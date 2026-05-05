import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { PaymentMethod } from '../payment-method/entities/payment-method.entity';
import { CitizenPaymentMethodController } from './citizen-payment-method.controller';
import { CitizenPaymentMethodService } from './citizen-payment-method.service';
import { CitizenPaymentMethod } from './entities/citizen-payment-method.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CitizenPaymentMethod, Citizen, PaymentMethod])],
  controllers: [CitizenPaymentMethodController],
  providers: [CitizenPaymentMethodService],
  exports: [CitizenPaymentMethodService],
})
export class CitizenPaymentMethodModule {}
