import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Node } from '../../node/entities/node.entity';
import { RouteStop } from './route-stop.entity';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 255 })
  name?: string;

  @Column({ type: 'varchar', length: 255 })
  origin?: string;

  @Column({ type: 'varchar', length: 255 })
  destination?: string;

  @Column({ type: 'float' })
  distance?: number;

  @Column({ type: 'int' })
  estimated_duration?: number;

  @Column({ type: 'boolean', default: true })
  is_active?: boolean;

  @OneToMany(() => Node, (node) => node.route)
  nodes?: Node[];

  @OneToMany(() => RouteStop, (routeStop) => routeStop.route)
  routeStops?: RouteStop[];
}
