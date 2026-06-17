import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { Group } from '../group/entities/group.entity';
import { GroupMembershipLog } from './entities/group-membership-log.entity';
import { NotificationsModule } from '../gateways/notifications/notifications.module';
import { FcmModule } from '../notifications-fcm/fcm.module';
import { GroupPersonService } from './group-person.service';
import { GroupPerson } from './entities/group-person.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupPerson, Group, Citizen, GroupMembershipLog]),
    NotificationsModule,
    FcmModule,
  ],
  controllers: [],
  providers: [GroupPersonService],
  exports: [GroupPersonService],
})
export class GroupPersonModule {}
