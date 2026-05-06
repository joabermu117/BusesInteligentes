import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../route/entities/route.entity';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { Node } from './entities/node.entity';

@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(Node)
    private readonly nodeRepository: Repository<Node>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
  ) {}

  async create(createNodeDto: CreateNodeDto): Promise<Node> {
    const route = await this.routeRepository.findOne({ where: { id: createNodeDto.route_id } });
    if (!route) {
      throw new NotFoundException(`Route #${createNodeDto.route_id} not found`);
    }

    const node = this.nodeRepository.create({
      ...createNodeDto,
      route,
    });

    return await this.nodeRepository.save(node);
  }

  async findAll(): Promise<Node[]> {
    return await this.nodeRepository.find({ relations: ['route'] });
  }

  async findOne(id: number): Promise<Node> {
    const node = await this.nodeRepository.findOne({
      where: { id },
      relations: ['route'],
    });
    if (!node) {
      throw new NotFoundException(`Node #${id} not found`);
    }
    return node;
  }

  async update(id: number, updateNodeDto: UpdateNodeDto): Promise<Node> {
    const node = await this.findOne(id);

    if (updateNodeDto.route_id !== undefined) {
      const route = await this.routeRepository.findOne({ where: { id: updateNodeDto.route_id } });
      if (!route) {
        throw new NotFoundException(`Route #${updateNodeDto.route_id} not found`);
      }
      node.route = route;
      node.route_id = route.id;
    }

    Object.assign(node, updateNodeDto);
    return await this.nodeRepository.save(node);
  }

  async remove(id: number): Promise<{ message: string }> {
    const node = await this.findOne(id);
    await this.nodeRepository.remove(node);
    return { message: `Node #${id} deleted successfully` };
  }
}
