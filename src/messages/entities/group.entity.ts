import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Citizen } from '../../citizen/entities/citizen.entity';
import { GroupPerson } from '../group-person/group-person.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'varchar', length: 255 })
  created_by_person_id: string;

  @OneToMany(() => GroupPerson, (groupPerson) => groupPerson.group)
  members?: GroupPerson[];
}
