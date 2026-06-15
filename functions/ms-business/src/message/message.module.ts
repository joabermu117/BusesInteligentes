import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { GroupMessageRead } from '../group-message-read/entities/group-message-read.entity';
import { GroupPerson } from '../group-person/entities/group-person.entity';
import { Group } from '../group/entities/group.entity';
import { NotificationsModule } from '../gateways/notifications/notifications.module';
import { RecipientGroup } from '../recipient-group/entities/recipient-group.entity';
import { RecipientPerson } from '../recipient-person/entities/recipient-person.entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { Message } from './entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Message,
      Citizen,
      RecipientPerson,
      RecipientGroup,
      GroupPerson,
      Group,
      GroupMessageRead,
    ]),
    NotificationsModule,
  ],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
