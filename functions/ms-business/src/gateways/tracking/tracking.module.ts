import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { TrackingGateway } from './tracking.gateway';
import { TrackingService } from './tracking.service';
import { ProximityService } from './proximity.service';
import { Gps } from '../../gps/entities/gps.entity';
import { Bus } from '../../buses/entities/bus.entity';
import { Shift } from '../../shifts/entities/shift.entity';
import { RouteStop } from '../../routes-stops/entities/route-stop.entity';
import { Route } from '../../route/entities/route.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { TrackingController } from './tracking.controller';
import { ProximityController } from './proximity.controller';
import { SimulatorController } from './simulator.controller';
import { BusSimulatorService } from './simulator.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Gps, Bus, Shift, RouteStop, Route, Schedule]),
    ScheduleModule.forRoot(),
  ],
  providers: [TrackingGateway, TrackingService, ProximityService, BusSimulatorService],
  controllers: [TrackingController, ProximityController, SimulatorController],
  exports: [TrackingGateway, TrackingService, ProximityService, BusSimulatorService],
})
export class TrackingModule {}
