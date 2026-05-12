import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizenPaymentMethod } from '../citizen-payment-method/entities/citizen-payment-method.entity';
import { Citizen } from '../citizen/entities/citizen.entity';
import { History } from '../history/entities/history.entity';
import { IncidentBus } from '../incidents-buses/entities/incident-bus.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Ticket } from './entities/ticket.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

import { Shift } from '../shifts/entities/shift.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      Citizen,
      CitizenPaymentMethod,
      Incident,
      IncidentBus,
      Schedule,
      History,
      Shift,
    ]),
  ],
  controllers: [TicketController, ReportController],
  providers: [TicketService, ReportService],
  exports: [TicketService, ReportService],
})
export class TicketModule {}
