import { Test, TestingModule } from '@nestjs/testing';
import { CitizenPaymentMethodController } from './citizen-payment-method.controller';
import { CitizenPaymentMethodService } from './citizen-payment-method.service';

describe('CitizenPaymentMethodController', () => {
  let controller: CitizenPaymentMethodController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CitizenPaymentMethodController],
      providers: [CitizenPaymentMethodService],
    }).compile();

    controller = module.get<CitizenPaymentMethodController>(CitizenPaymentMethodController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
