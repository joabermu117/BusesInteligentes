import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { Route } from '../../route/entities/route.entity';

@Entity('schedules')
export class Schedule {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  routeId?: number;

  @Column()
  departureTime?: Date;

  @Column({ nullable: true })
  toleranceMinutes?: number;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled',
  })
  status?: string;

  @Column({
    type: 'enum',
    enum: ['none', 'weekdays', 'weekends', 'daily'],
    default: 'none',
  })
  recurrence?: string;

  @Column({ nullable: true })
  date?: Date;

  @ManyToOne(() => Bus, (bus) => bus.schedules)
  bus?: Bus;

  @ManyToOne(() => Route, { nullable: true, eager: false })
  route?: Route;

  @OneToMany(() => Ticket, (ticket) => ticket.schedule, { cascade: true })
  tickets?: Ticket[];
}