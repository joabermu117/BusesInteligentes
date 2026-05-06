import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { NodeService } from './node.service';

@Controller('api/nodes')
export class NodeController {
  constructor(private readonly nodeService: NodeService) {}

  @Post()
  create(@Body() createNodeDto: CreateNodeDto) {
    return this.nodeService.create(createNodeDto);
  }

  @Get()
  findAll() {
    return this.nodeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.nodeService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateNodeDto: UpdateNodeDto) {
    return this.nodeService.update(+id, updateNodeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.nodeService.remove(+id);
  }
}
