import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Message } from '../message/message.entity';
import { Citizen } from '../../citizen/entities/citizen.entity';

@Entity('recipient_persons')
export class RecipientPerson {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Message, (message) => message.recipients)
  message?: Message;

  @Column({ type: 'varchar', length: 255 })
  recipient_person_id: string;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date;
}
