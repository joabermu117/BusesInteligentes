import { Test, TestingModule } from '@nestjs/testing';
import { PqrsService } from './pqrs.service';

describe('PqrsService', () => {
  let service: PqrsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PqrsService],
    }).compile();

    service = module.get<PqrsService>(PqrsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
