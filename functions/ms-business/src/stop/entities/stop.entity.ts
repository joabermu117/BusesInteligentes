import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RouteStop } from '../../routes-stops/entities/route-stop.entity';

@Entity('stops')
export class Stop {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 255 })
  name?: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude?: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude?: number;

  @Column({ type: 'varchar', length: 255 })
  address?: string;

  @Column({ type: 'boolean', default: true })
  is_active?: boolean;

  @OneToMany(() => RouteStop, (routeStop) => routeStop.stop)
  routeStops?: RouteStop[];
}
