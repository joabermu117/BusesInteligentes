import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Group } from '../group/group.entity';
import { Citizen } from '../../citizen/entities/citizen.entity';

@Entity('group_persons')
export class GroupPerson {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Group, (group) => group.members)
  group?: Group;

  @Column({ type: 'varchar', length: 255 })
  person_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at: Date;

  @Column({ type: 'enum', enum: ['admin', 'member'] })
  role: string;
}
