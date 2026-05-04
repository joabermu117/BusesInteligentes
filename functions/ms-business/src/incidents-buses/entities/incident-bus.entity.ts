import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';
import { Incident } from '../../incidents/entities/incident.entity';
import { Photo } from '../../photos/entities/photo.entity';

@Entity('incidents_buses')
export class IncidentBus {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ nullable: true })
  driverUserId?: string;

  @Column({ nullable: true })
  shiftId?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ nullable: true })
  reportedAt?: Date;

  @ManyToOne(() => Bus, (bus) => bus.incidentBuses)
  bus?: Bus;

  @ManyToOne(() => Incident, (incident) => incident.incidentBuses)
  incident?: Incident;

  @OneToMany(() => Photo, (photo) => photo.incidentBus, { cascade: true })
  photos?: Photo[];
}