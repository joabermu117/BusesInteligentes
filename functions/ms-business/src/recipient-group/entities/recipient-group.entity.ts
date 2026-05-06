import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Group } from '../../group/entities/group.entity';
import { Message } from '../../message/entities/message.entity';

@Entity('recipient_groups')
export class RecipientGroup {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'int' })
  message_id?: number;

  @ManyToOne(() => Message, (message) => message.recipientGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id', referencedColumnName: 'id' })
  message?: Message;

  @Column({ type: 'int' })
  group_id?: number;

  @ManyToOne(() => Group, (group) => group.recipientGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group?: Group;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at?: Date;
}
