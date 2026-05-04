import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Gps } from './entities/gps.entity';
import { Bus } from '../buses/entities/bus.entity';
import { GpsController } from './gps.controller';
import { GpsService } from './gps.service';

@Module({
  imports: [TypeOrmModule.forFeature([Gps, Bus])],
  controllers: [GpsController],
  providers: [GpsService],
  exports: [GpsService],
})
export class GpsModule {}