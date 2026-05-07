import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { StartShiftDto } from './dto/start-shift.dto';

@Controller('api/shifts')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  create(@Body() createShiftDto: CreateShiftDto) {
    return this.shiftsService.create(createShiftDto);
  }

  @Get()
  findAll() {
    return this.shiftsService.findAll();
  }

  @Get('bus/:busId')
  findByBus(@Param('busId') busId: string) {
    return this.shiftsService.findByBus(+busId);
  }

  @Get('driver/:driverUserId/active')
  findActiveByDriver(@Param('driverUserId') driverUserId: string) {
    return this.shiftsService.findActiveByDriver(driverUserId);
  }

  @Get('driver/:driverUserId')
  findByDriver(@Param('driverUserId') driverUserId: string) {
    return this.shiftsService.findByDriver(driverUserId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shiftsService.findOne(+id);
  }

  @Patch(':id/start')
  startShift(@Param('id') id: string, @Body() dto: StartShiftDto) {
    return this.shiftsService.startShift(+id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateShiftDto: UpdateShiftDto) {
    return this.shiftsService.update(+id, updateShiftDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shiftsService.remove(+id);
  }
}
