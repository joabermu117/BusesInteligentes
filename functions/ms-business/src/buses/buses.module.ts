import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bus } from './entities/bus.entity';
import { Company } from '../companies/entities/company.entity';
import { BusesController } from './buses.controller';
import { BusesService } from './buses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bus, Company])],
  controllers: [BusesController],
  providers: [BusesService],
  exports: [BusesService],
})
export class BusesModule {}