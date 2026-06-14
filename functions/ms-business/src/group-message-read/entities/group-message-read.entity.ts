import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Citizen } from '../../citizen/entities/citizen.entity';
import { Group } from '../../group/entities/group.entity';
import { Message } from '../../message/entities/message.entity';

@Entity('group_message_reads')
export class GroupMessageRead {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'int' })
  message_id?: number;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id', referencedColumnName: 'id' })
  message?: Message;

  @Column({ type: 'int' })
  group_id?: number;

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group?: Group;

  @Column({ type: 'varchar', length: 255 })
  person_id?: string;

  @ManyToOne(() => Citizen, { nullable: false })
  @JoinColumn({ name: 'person_id', referencedColumnName: 'person_id' })
  person?: Citizen;

  @Column({ type: 'timestamp', nullable: true })
  read_at?: Date;
}
