import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { GroupPersonModule } from '../group-person/group-person.module';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Group } from './entities/group.entity';
import { GroupPerson } from 'src/group-person/entities/group-person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, Citizen, GroupPerson]), GroupPersonModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
