import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Gps } from '../../gps/entities/gps.entity';
import { Shift } from '../../shifts/entities/shift.entity';
import { IncidentBus } from '../../incidents-buses/entities/incident-bus.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ unique: true })
  plate?: string;

  @Column()
  model?: string;

  @Column()
  year?: number;

  @Column()
  totalCapacity?: number;

  @Column({ nullable: true })
  seatedCapacity?: number;

  @Column({ nullable: true })
  standingCapacity?: number;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ nullable: true })
  qrCode?: string;

  @Column({
    type: 'enum',
    enum: ['operative', 'maintenance', 'out_of_service'],
    default: 'operative',
  })
  status?: string;

  @ManyToOne(() => Company, (company) => company.buses)
  company?: Company;

  @OneToOne(() => Gps, (gps) => gps.bus, { cascade: true, nullable: true })
  gps?: Gps;

  @OneToMany(() => Shift, (shift) => shift.bus)
  shifts?: Shift[];

  @OneToMany(() => IncidentBus, (incidentBus) => incidentBus.bus)
  incidentBuses?: IncidentBus[];

  @OneToMany(() => Schedule, (schedule) => schedule.bus)
  schedules?: Schedule[];
}