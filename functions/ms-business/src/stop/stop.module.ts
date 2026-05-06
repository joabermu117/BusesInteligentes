import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteStop } from '../route/entities/route-stop.entity';
import { StopController } from './stop.controller';
import { StopService } from './stop.service';
import { Stop } from './entities/stop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Stop, RouteStop])],
  controllers: [StopController],
  providers: [StopService],
  exports: [StopService],
})
export class StopModule {}
