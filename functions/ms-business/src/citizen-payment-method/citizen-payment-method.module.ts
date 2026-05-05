import { Module } from '@nestjs/common';
import { CitizenPaymentMethodService } from './citizen-payment-method.service';
import { CitizenPaymentMethodController } from './citizen-payment-method.controller';

@Module({
  controllers: [CitizenPaymentMethodController],
  providers: [CitizenPaymentMethodService],
})
export class CitizenPaymentMethodModule {}
