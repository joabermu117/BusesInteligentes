import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Node } from '../node/entities/node.entity';
import { Stop } from '../stop/entities/stop.entity';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route-stop.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Route, Node, Stop, RouteStop])],
  controllers: [RouteController],
  providers: [RouteService],
  exports: [RouteService],
})
export class RouteModule {}
