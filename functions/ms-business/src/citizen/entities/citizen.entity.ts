import { Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn } from 'typeorm';
import { Address } from '../../address/entities/address.entity';
import { CitizenPaymentMethod } from '../../citizen-payment-method/entities/citizen-payment-method.entity';
import { Person } from '../../person/person.base';
import { Ticket } from '../../ticket/entities/ticket.entity';

@Entity('citizens')
export class Citizen extends Person {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  person_id: string;

  /**
   * Bidirectional 1:N relationship with Address
   * A citizen can have multiple addresses
   */
  @OneToMany(() => Address, (address) => address.citizen, { cascade: true })
  addresses?: Address[];

  /**
   * Bidirectional 1:N relationship with Ticket
   * A citizen can purchase multiple tickets
   */
  @OneToMany(() => Ticket, (ticket) => ticket.citizen, { cascade: true })
  tickets?: Ticket[];

  /**
   * Bidirectional 1:N relationship with CitizenPaymentMethod
   * A citizen can have multiple payment methods
   */
  @OneToMany(
    () => CitizenPaymentMethod,
    (citizenPaymentMethod) => citizenPaymentMethod.citizen,
    { cascade: true }
  )
  paymentMethods?: CitizenPaymentMethod[];

  constructor(person_id: string) {
    super(person_id);
    this.person_id = person_id;
  }
}
