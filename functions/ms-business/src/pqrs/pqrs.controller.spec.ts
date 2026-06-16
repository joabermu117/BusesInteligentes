import { Test, TestingModule } from '@nestjs/testing';
import { PqrsController } from './pqrs.controller';

describe('PqrsController', () => {
  let controller: PqrsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PqrsController],
    }).compile();

    controller = module.get<PqrsController>(PqrsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
