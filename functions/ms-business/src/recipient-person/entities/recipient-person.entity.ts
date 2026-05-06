import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Citizen } from '../../citizen/entities/citizen.entity';
import { Message } from '../../message/entities/message.entity';

@Entity('recipient_persons')
export class RecipientPerson {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'int' })
  message_id?: number;

  @ManyToOne(() => Message, (message) => message.recipientPersons, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'message_id', referencedColumnName: 'id' })
  message?: Message;

  @Column({ type: 'varchar', length: 255 })
  recipient_person_id?: string;

  @ManyToOne(() => Citizen, { nullable: false })
  @JoinColumn({ name: 'recipient_person_id', referencedColumnName: 'person_id' })
  recipient?: Citizen;

  @Column({ type: 'timestamp', nullable: true })
  read_at?: Date;
}
