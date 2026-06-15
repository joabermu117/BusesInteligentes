import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Citizen } from '../../citizen/entities/citizen.entity';
import { RecipientGroup } from '../../recipient-group/entities/recipient-group.entity';
import { RecipientPerson } from '../../recipient-person/entities/recipient-person.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'text' })
  content?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  sent_at?: Date;

  @Column({ type: 'varchar', length: 255 })
  sender_person_id?: string;

  @ManyToOne(() => Citizen, { nullable: false })
  @JoinColumn({ name: 'sender_person_id', referencedColumnName: 'person_id' })
  sender?: Citizen;

  @Column({ type: 'enum', enum: ['personal', 'group', 'mass_alert'] })
  message_type?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ type: 'boolean', default: false })
  is_urgent?: boolean;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_at?: Date;

  @Column({ type: 'boolean', default: false })
  is_readonly?: boolean;

  @Column({ type: 'boolean', default: false })
  is_dispatched?: boolean;

  @OneToMany(() => RecipientPerson, (recipientPerson) => recipientPerson.message)
  recipientPersons?: RecipientPerson[];

  @OneToMany(() => RecipientGroup, (recipientGroup) => recipientGroup.message)
  recipientGroups?: RecipientGroup[];
}
