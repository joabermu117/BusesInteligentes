import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Route } from '../route/route.entity';

@Entity('stops')
export class Stop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column('decimal', { precision: 10, scale: 7 })
  latitude: number;

  @Column('decimal', { precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'boolean' })
  is_active: boolean;

  @ManyToMany(() => Route, (route) => route.stops)
  @JoinTable({
    name: 'route_stop',
    joinColumn: {
      name: 'stop_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'route_id',
      referencedColumnName: 'id'
    }
  })
  routes?: Route[];
}
