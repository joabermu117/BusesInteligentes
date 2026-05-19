import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { RouteStopsService } from './route-stops.service';

@Controller('api/route-stops')
export class RouteStopsController {
  constructor(private readonly routeStopsService: RouteStopsService) {}

  @Post()
  create(@Body() dto: CreateRouteStopDto) {
    return this.routeStopsService.create(dto);
  }

  @Get()
  findAll() {
    return this.routeStopsService.findAll();
  }

  @Get('route/:routeId')
  findByRoute(@Param('routeId') routeId: string) {
    return this.routeStopsService.findByRoute(+routeId);
  }

  @Get('stop/:stopId')
  findByStop(@Param('stopId') stopId: string) {
    return this.routeStopsService.findByStop(+stopId);
  }

  @Patch('route/:routeId/stop/:stopId')
  update(
    @Param('routeId') routeId: string,
    @Param('stopId') stopId: string,
    @Body() dto: UpdateRouteStopDto,
  ) {
    return this.routeStopsService.update(+routeId, +stopId, dto);
  }

  @Delete('route/:routeId/stop/:stopId')
  remove(
    @Param('routeId') routeId: string,
    @Param('stopId') stopId: string,
  ) {
    return this.routeStopsService.remove(+routeId, +stopId);
  }
}