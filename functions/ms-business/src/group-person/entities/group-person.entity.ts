import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Citizen } from '../../citizen/entities/citizen.entity';
import { Group } from '../../group/entities/group.entity';

@Entity('group_persons')
export class GroupPerson {
  @PrimaryColumn({ type: 'int' })
  group_id: number;

  @PrimaryColumn({ type: 'varchar', length: 255 })
  person_id: string;

  @ManyToOne(() => Group, (group) => group.groupPersons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group?: Group;

  @ManyToOne(() => Citizen, { nullable: false })
  @JoinColumn({ name: 'person_id', referencedColumnName: 'person_id' })
  person?: Citizen;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joined_at?: Date;

  @Column({ type: 'enum', enum: ['admin', 'member'], default: 'member' })
  role?: string;
}
