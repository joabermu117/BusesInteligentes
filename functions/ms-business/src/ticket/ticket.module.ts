import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizenPaymentMethod } from '../citizen-payment-method/entities/citizen-payment-method.entity';
import { Citizen } from '../citizen/entities/citizen.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { History } from '../history/entities/history.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';

@Module({
    imports: [TypeOrmModule.forFeature([Ticket, Citizen, CitizenPaymentMethod, Schedule, History])],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}
