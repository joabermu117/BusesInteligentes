import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Citizen } from '../../citizen/entities/citizen.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sent_at: Date;

  @Column({ type: 'varchar', length: 255 })
  sender_person_id: string;

  @Column({ type: 'enum', enum: ['personal', 'group'] })
  message_type: string;

  @OneToMany(() => RecipientPerson, (recipientPerson) => recipientPerson.message)
  recipients?: RecipientPerson[];

  @OneToMany(() => RecipientGroup, (recipientGroup) => recipientGroup.message)
  groupRecipients?: RecipientGroup[];
}
