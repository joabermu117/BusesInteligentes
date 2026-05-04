import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { IncidentBus } from '../../incidents-buses/entities/incident-bus.entity';

@Entity('photos')
export class Photo {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  url?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  uploadedAt?: Date;

  @ManyToOne(() => IncidentBus, (incidentBus) => incidentBus.photos)
  incidentBus?: IncidentBus;
}