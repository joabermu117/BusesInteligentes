import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Route } from '../../route/entities/route.entity';

@Entity('nodes')
export class Node {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude?: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude?: number;

  @Column({ type: 'enum', enum: ['stop', 'waypoint'] })
  type?: string;

  @Column({ type: 'int' })
  sequence_order?: number;

  @Column({ type: 'int' })
  route_id?: number;

  @ManyToOne(() => Route, (route) => route.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id', referencedColumnName: 'id' })
  route?: Route;
}
