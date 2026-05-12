import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IncidentBus } from '../../incidents-buses/entities/incident-bus.entity';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({
    type: 'enum',
    enum: ['mechanical', 'accident', 'delay', 'passenger', 'other'],
  })
  type?: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high', 'critical'],
  })
  severity?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_review', 'resolved'],
    default: 'pending',
  })
  status?: string;

  @Column({ nullable: true })
  reportedAt?: Date;

  @Column({ nullable: true })
  resolvedAt?: Date;

  @Column({ nullable: true })
  supervisorComment?: string;

  @OneToMany(() => IncidentBus, (incidentBus) => incidentBus.incident, {
    cascade: true,
  })
  incidentBuses?: IncidentBus[];
}
