import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Message } from '../message/message.entity';
import { Group } from '../../groups/entities/group.entity';

@Entity('recipient_groups')
export class RecipientGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Message, (message) => message.groupRecipients)
  message?: Message;

  @ManyToOne(() => Group, (group) => group.recipients)
  group?: Group;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date;
}
