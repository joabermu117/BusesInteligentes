import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardingController } from './boarding.controller';
import { BoardingService } from './boarding.service';
import { Ticket } from '../ticket/entities/ticket.entity';
import { History } from '../history/entities/history.entity';
import { Citizen } from '../citizen/entities/citizen.entity';
import { CitizenPaymentMethod } from '../citizen-payment-method/entities/citizen-payment-method.entity';
import { Schedule } from '../schedules/entities/schedule.entity';
import { Route } from '../route/entities/route.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      History,
      Citizen,
      CitizenPaymentMethod,
      Schedule,
      Route,
    ]),
  ],
  controllers: [BoardingController],
  providers: [BoardingService],
  exports: [BoardingService],
})
export class BoardingModule {}
