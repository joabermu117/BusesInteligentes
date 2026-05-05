import { Test, TestingModule } from '@nestjs/testing';
import { CitizenPaymentMethodService } from './citizen-payment-method.service';

describe('CitizenPaymentMethodService', () => {
  let service: CitizenPaymentMethodService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CitizenPaymentMethodService],
    }).compile();

    service = module.get<CitizenPaymentMethodService>(CitizenPaymentMethodService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
