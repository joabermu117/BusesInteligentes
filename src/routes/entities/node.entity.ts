import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Route } from '../route/route.entity';

@Entity('nodes')
export class Node {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'enum', enum: ['stop', 'waypoint'] })
  type: string;

  @Column({ type: 'int' })
  sequence_order: number;

  @ManyToOne(() => Route, (route) => route.nodes)
  route?: Route;
}
