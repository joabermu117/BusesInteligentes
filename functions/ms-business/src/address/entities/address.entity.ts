import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Citizen } from '../../citizen/entities/citizen.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 255 })
  street?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  zipCode?: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ default: false })
  isPrimary?: boolean;

  /**
   * Bidirectional N:1 relationship with Citizen
   * An address belongs to one citizen
   */
  @ManyToOne(() => Citizen, (citizen) => citizen.addresses)
  citizen?: Citizen;
}
