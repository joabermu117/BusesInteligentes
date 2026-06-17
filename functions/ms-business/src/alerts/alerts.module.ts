import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { NotificationsModule } from '../gateways/notifications/notifications.module';
import { FcmModule } from '../notifications-fcm/fcm.module';
import { Message } from '../message/entities/message.entity';
import { RecipientPerson } from '../recipient-person/entities/recipient-person.entity';
import { AlertsController } from './alerts.controller';
import { AlertsSchedulerService } from './alerts-scheduler.service';
import { AlertsService } from './alerts.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Citizen, RecipientPerson]),
    NotificationsModule,
    FcmModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsSchedulerService],
  exports: [AlertsService],
})
export class AlertsModule {}
