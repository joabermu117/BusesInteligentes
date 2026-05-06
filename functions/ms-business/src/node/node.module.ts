import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Route } from '../route/entities/route.entity';
import { NodeController } from './node.controller';
import { NodeService } from './node.service';
import { Node } from './entities/node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Node, Route])],
  controllers: [NodeController],
  providers: [NodeService],
  exports: [NodeService],
})
export class NodeModule {}
