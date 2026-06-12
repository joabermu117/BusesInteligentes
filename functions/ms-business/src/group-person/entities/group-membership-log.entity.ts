import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Group } from '../../group/entities/group.entity';

@Entity('group_membership_logs')
export class GroupMembershipLog {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'int' })
  group_id?: number;

  @Column({ type: 'varchar', length: 255 })
  person_id?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  action_by_person_id?: string;

  @Column({
    type: 'enum',
    enum: ['joined', 'left', 'removed', 'promoted', 'blocked'],
  })
  action?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  action_at?: Date;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group?: Group;
}