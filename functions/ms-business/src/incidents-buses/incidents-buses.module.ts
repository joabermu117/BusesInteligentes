import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentBus } from './entities/incident-bus.entity';
import { Bus } from '../buses/entities/bus.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { IncidentsBusesController } from './incidents-buses.controller';
import { IncidentsBusesService } from './incidents-buses.service';

@Module({
  imports: [TypeOrmModule.forFeature([IncidentBus, Bus, Incident])],
  controllers: [IncidentsBusesController],
  providers: [IncidentsBusesService],
  exports: [IncidentsBusesService],
})
export class IncidentsBusesModule {}