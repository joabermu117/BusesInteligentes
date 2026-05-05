import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CitizenPaymentMethod } from '../../citizen-payment-method/entities/citizen-payment-method.entity';
import { Citizen } from '../../citizen/entities/citizen.entity';
import { History } from '../../history/entities/history.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  ticketNumber?: string;

  @Column({
    type: 'enum',
    enum: ['issued', 'used', 'expired', 'cancelled'],
    default: 'issued',
  })
  status?: string;

  @Column({ nullable: true })
  issuedDate?: Date;

  @Column({ nullable: true })
  expirationDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ type: 'text', nullable: true })
  qrCode?: string;

  @Column({ default: false })
  isBoardingPass?: boolean;

  /**
   * Bidirectional N:1 relationship with Citizen
   * Many tickets belong to one citizen
   */
  @ManyToOne(() => Citizen, (citizen) => citizen.tickets)
  citizen?: Citizen;

  /**
   * N:1 relationship with CitizenPaymentMethod
   * Many tickets can use one citizen payment method
   */
  @ManyToOne(() => CitizenPaymentMethod)
  paymentMethod?: CitizenPaymentMethod;

  /**
   * N:1 relationship with Schedule
   * Many tickets belong to one schedule
   */
  @ManyToOne(() => Schedule, (schedule) => schedule.tickets)
  schedule?: Schedule;

  /**
   * Bidirectional 1:N relationship with History
   * A ticket can have multiple history records (audit trail)
   * History acts as an intermediate table for the N:N relationship with Node
   */
  @OneToMany(() => History, (history) => history.ticket, { cascade: true })
  history?: History[];
}
