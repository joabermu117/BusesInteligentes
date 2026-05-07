import { Body, Controller, Post } from '@nestjs/common';
import { BoardingService } from './boarding.service';
import { BoardBusDto } from './dto/board-bus.dto';
import { AlightBusDto } from './dto/alight-bus.dto';
import { ValidatePaymentDto } from './dto/validate-payment.dto';

@Controller('api/boarding')
export class BoardingController {
  constructor(private readonly boardingService: BoardingService) {}

  @Post('board')
  boardBus(@Body() dto: BoardBusDto) {
    return this.boardingService.boardBus(dto);
  }

  @Post('alight')
  alightBus(@Body() dto: AlightBusDto) {
    return this.boardingService.alightBus(dto);
  }

  @Post('validate-payment')
  validatePayment(@Body() dto: ValidatePaymentDto) {
    return this.boardingService.validatePaymentMethod(dto);
  }
}
