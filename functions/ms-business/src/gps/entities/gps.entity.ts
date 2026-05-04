import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';

@Entity('gps')
export class Gps {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ nullable: true })
  lastUpdate?: Date;

  @Column({ default: false })
  active?: boolean;

  @OneToOne(() => Bus, (bus) => bus.gps)
  @JoinColumn()
  bus?: Bus;
}