import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Citizen } from '../../citizen/entities/citizen.entity';
import { GroupMembershipLog } from '../../group-person/entities/group-membership-log.entity';
import { GroupPerson } from '../../group-person/entities/group-person.entity';
import { RecipientGroup } from '../../recipient-group/entities/recipient-group.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 255 })
  name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'boolean', default: true })
  is_public?: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at?: Date;

  @Column({ type: 'varchar', length: 255 })
  created_by_person_id?: string;

  @ManyToOne(() => Citizen, { nullable: false })
  @JoinColumn({ name: 'created_by_person_id', referencedColumnName: 'person_id' })
  created_by?: Citizen;

  @OneToMany(() => GroupPerson, (groupPerson) => groupPerson.group)
  groupPersons?: GroupPerson[];

  @OneToMany(() => RecipientGroup, (recipientGroup) => recipientGroup.group)
  recipientGroups?: RecipientGroup[];

  @OneToMany(() => GroupMembershipLog, (log) => log.group)
  membershipLogs?: GroupMembershipLog[];
}