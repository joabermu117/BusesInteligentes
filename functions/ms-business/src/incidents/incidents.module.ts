import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from './entities/incident.entity';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentBus } from 'src/incidents-buses/entities/incident-bus.entity';
import { Photo } from 'src/photos/entities/photo.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incident, IncidentBus, Photo])],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}