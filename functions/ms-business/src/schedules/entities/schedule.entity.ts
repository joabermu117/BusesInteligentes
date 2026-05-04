import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';

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
}