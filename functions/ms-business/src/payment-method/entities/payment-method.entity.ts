import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CitizenPaymentMethod } from '../../citizen-payment-method/entities/citizen-payment-method.entity';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive?: boolean;

  @Column({ default: false })
  isPrepaid?: boolean;

  /**
   * Bidirectional 1:N relationship with CitizenPaymentMethod
   * A payment method can be used by many citizens
   */
  @OneToMany(
    () => CitizenPaymentMethod,
    (citizenPaymentMethod) => citizenPaymentMethod.paymentMethod
  )
  citizenPaymentMethods?: CitizenPaymentMethod[];
}
