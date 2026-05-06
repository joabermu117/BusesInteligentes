import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { Message } from '../message/entities/message.entity';
import { RecipientPersonController } from './recipient-person.controller';
import { RecipientPersonService } from './recipient-person.service';
import { RecipientPerson } from './entities/recipient-person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RecipientPerson, Message, Citizen])],
  controllers: [RecipientPersonController],
  providers: [RecipientPersonService],
  exports: [RecipientPersonService],
})
export class RecipientPersonModule {}
