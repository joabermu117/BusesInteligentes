import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Citizen } from '../citizen/entities/citizen.entity';
import { Group } from '../group/entities/group.entity';
import { GroupPersonService } from './group-person.service';
import { GroupPerson } from './entities/group-person.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GroupPerson, Group, Citizen])],
  controllers: [],
  providers: [GroupPersonService],
  exports: [GroupPersonService],
})
export class GroupPersonModule {}
