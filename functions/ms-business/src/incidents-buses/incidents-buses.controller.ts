import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { IncidentsBusesService } from './incidents-buses.service';
import { CreateIncidentBusDto } from './dto/create-incident-bus.dto';
import { UpdateIncidentBusDto } from './dto/update-incident-bus.dto';

@Controller('api/incidents-buses')
export class IncidentsBusesController {
  constructor(private readonly incidentsBusesService: IncidentsBusesService) {}

  @Post()
  create(@Body() createIncidentBusDto: CreateIncidentBusDto) {
    return this.incidentsBusesService.create(createIncidentBusDto);
  }

  @Get()
  findAll() {
    return this.incidentsBusesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsBusesService.findOne(+id);
  }

  @Get('bus/:busId')
  findByBus(@Param('busId') busId: string) {
    return this.incidentsBusesService.findByBus(+busId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIncidentBusDto: UpdateIncidentBusDto) {
    return this.incidentsBusesService.update(+id, updateIncidentBusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.incidentsBusesService.remove(+id);
  }
}