import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { AddRouteStopDto } from './dto/add-route-stop.dto';
import { RouteService } from './route.service';

@Controller('api/routes')
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  create(@Body() createRouteDto: CreateRouteDto) {
    return this.routeService.create(createRouteDto);
  }

  @Get()
  findAll(@Query('name') name?: string) {
    return this.routeService.findAll(name);
  }

  @Get(':id/stops')
  findStops(@Param('id') id: string) {
    return this.routeService.findStopsByRoute(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.routeService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
    return this.routeService.update(+id, updateRouteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.routeService.remove(+id);
  }

  @Post(':id/stops')
  addStop(@Param('id') id: string, @Body() addRouteStopDto: AddRouteStopDto) {
    return this.routeService.addStop(+id, addRouteStopDto);
  }

  @Delete(':id/stops/:stopId')
  removeStop(@Param('id') id: string, @Param('stopId') stopId: string) {
    return this.routeService.removeStop(+id, +stopId);
  }
}
