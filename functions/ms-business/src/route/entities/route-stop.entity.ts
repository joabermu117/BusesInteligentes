import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Stop } from '../../stop/entities/stop.entity';
import { Route } from './route.entity';

@Entity('route_stop')
export class RouteStop {
  @PrimaryColumn({ type: 'int' })
  route_id: number;

  @PrimaryColumn({ type: 'int' })
  stop_id: number;

  @Column({ type: 'int' })
  order_index?: number;

  @ManyToOne(() => Route, (route) => route.routeStops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id', referencedColumnName: 'id' })
  route?: Route;

  @ManyToOne(() => Stop, (stop) => stop.routeStops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stop_id', referencedColumnName: 'id' })
  stop?: Stop;
}
