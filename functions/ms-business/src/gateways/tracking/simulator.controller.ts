import { Controller, Get, Post } from '@nestjs/common';
import { BusSimulatorService } from './simulator.service';

@Controller('api/simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: BusSimulatorService) {}

  @Post('start')
  start() {
    return this.simulatorService.start();
  }

  @Post('stop')
  stop() {
    return this.simulatorService.stop();
  }

  @Get('status')
  status() {
    return this.simulatorService.getStatus();
  }
}
