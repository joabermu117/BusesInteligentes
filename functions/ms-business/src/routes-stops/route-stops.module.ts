import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from '../route/entities/route.entity';
import { Stop } from '../stop/entities/stop.entity';
import { RouteStopsController } from './route-stops.controller';
import { RouteStopsService } from './route-stops.service';
import { RouteStop } from './entities/route-stop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RouteStop, Route, Stop])],
  controllers: [RouteStopsController],
  providers: [RouteStopsService],
  exports: [RouteStopsService],
})
export class RouteStopsModule {}