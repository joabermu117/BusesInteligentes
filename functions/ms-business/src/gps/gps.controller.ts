import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GpsService } from './gps.service';
import { CreateGpsDto } from './dto/create-gps.dto';
import { UpdateGpsDto } from './dto/update-gps.dto';

@Controller('api/gps')
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Post()
  create(@Body() createGpsDto: CreateGpsDto) {
    return this.gpsService.create(createGpsDto);
  }

  @Get()
  findAll() {
    return this.gpsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gpsService.findOne(+id);
  }

  @Get('bus/:busId')
  findByBus(@Param('busId') busId: string) {
    return this.gpsService.findByBus(+busId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGpsDto: UpdateGpsDto) {
    return this.gpsService.update(+id, updateGpsDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gpsService.remove(+id);
  }
}