import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ticket } from '../../ticket/entities/ticket.entity';

@Entity('histories')
export class History {
  @PrimaryGeneratedColumn()
  id?: number;

  /**
   * Reference to the person_id from MongoDB Security microservice
   * Used for audit trail linking
   */
  @Column({ type: 'varchar', length: 255 })
  personId?: string;

  @Column()
  timestamp?: Date;

  @Column({ type: 'enum', enum: ['created', 'updated', 'deleted', 'boarded', 'validated'] })
  action?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ nullable: true })
  nodeId?: string;

  /**
   * Bidirectional N:1 relationship with Ticket
   * Many history records belong to one ticket
   * History acts as an intermediate table for the N:N relationship with Node
   */
  @ManyToOne(() => Ticket, (ticket) => ticket.history)
  ticket?: Ticket;
}
