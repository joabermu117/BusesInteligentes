import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../group/entities/group.entity';
import { Message } from '../message/entities/message.entity';
import { RecipientGroupController } from './recipient-group.controller';
import { RecipientGroupService } from './recipient-group.service';
import { RecipientGroup } from './entities/recipient-group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RecipientGroup, Message, Group])],
  controllers: [RecipientGroupController],
  providers: [RecipientGroupService],
  exports: [RecipientGroupService],
})
export class RecipientGroupModule {}
