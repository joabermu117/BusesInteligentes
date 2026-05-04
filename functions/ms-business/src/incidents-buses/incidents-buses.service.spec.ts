import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsBusesService } from './incidents-buses.service';

describe('IncidentsBusesService', () => {
  let service: IncidentsBusesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncidentsBusesService],
    }).compile();

    service = module.get<IncidentsBusesService>(IncidentsBusesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
