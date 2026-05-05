import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Citizen } from '../../citizen/entities/citizen.entity';
import { PaymentMethod } from '../../payment-method/entities/payment-method.entity';

@Entity('citizen_payment_methods')
export class CitizenPaymentMethod {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cardNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cardHolder?: string;

  @Column({ nullable: true })
  expirationDate?: Date;

  @Column({ default: false })
  isDefault?: boolean;

  @Column({ default: true })
  isActive?: boolean;

  /**
   * Bidirectional N:1 relationship with Citizen
   * Many payment methods belong to one citizen
   */
  @ManyToOne(() => Citizen, (citizen) => citizen.paymentMethods)
  citizen?: Citizen;

  /**
   * Bidirectional N:1 relationship with PaymentMethod
   * Many citizen payment methods reference one payment method
   */
  @ManyToOne(
    () => PaymentMethod,
    (paymentMethod) => paymentMethod.citizenPaymentMethods
  )
  paymentMethod?: PaymentMethod;
}
