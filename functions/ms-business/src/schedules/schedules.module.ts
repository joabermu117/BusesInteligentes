import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from './entities/schedule.entity';
import { Bus } from '../buses/entities/bus.entity';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { Route } from 'src/route/entities/route.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Bus, Route])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}