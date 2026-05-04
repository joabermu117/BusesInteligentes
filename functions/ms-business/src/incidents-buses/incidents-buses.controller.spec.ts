import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsBusesController } from './incidents-buses.controller';

describe('IncidentsBusesController', () => {
  let controller: IncidentsBusesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsBusesController],
    }).compile();

    controller = module.get<IncidentsBusesController>(IncidentsBusesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
