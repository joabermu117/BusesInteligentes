import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  driverUserId?: string;

  @Column()
  startTime?: Date;

  @Column({ nullable: true })
  endTime?: Date;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'in_progress', 'finished', 'cancelled'],
    default: 'scheduled',
  })
  status?: string;

  @Column({ nullable: true })
  observations?: string;

  @Column({ nullable: true })
  busCondition?: string;

  @ManyToOne(() => Bus, (bus) => bus.shifts)
  bus?: Bus;
}