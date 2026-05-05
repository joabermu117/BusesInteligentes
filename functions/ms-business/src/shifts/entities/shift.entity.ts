import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';
import { Driver } from '../../driver/entities/driver.entity';

@Entity('shifts')
export class Shift {
  @PrimaryGeneratedColumn()
  id?: number;

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

  /**
   * Bidirectional N:1 relationship with Driver
   * Many shifts belong to one driver
   * Shift acts as an intermediate table for the N:N relationship with Bus
   */
  @ManyToOne(() => Driver, (driver) => driver.shifts)
  driver?: Driver;

  /**
   * Bidirectional N:1 relationship with Bus
   * Many shifts belong to one bus
   */
  @ManyToOne(() => Bus, (bus) => bus.shifts)
  bus?: Bus;
}