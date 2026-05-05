import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Contract } from '../../contract/entities/contract.entity';
import { Person } from '../../person/person.base';
import { Shift } from '../../shifts/entities/shift.entity';

@Entity('drivers')
export class Driver extends Person {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  person_id: string;

  @Column({ nullable: true })
  licenseNumber?: string;

  @Column({ nullable: true })
  licenseExpiration?: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  })
  status?: string;

  /**
   * Bidirectional 1:N relationship with Shift
   * A driver can have multiple shifts
   * Shift acts as an intermediate table for the N:N relationship with Bus
   */
  @OneToMany(() => Shift, (shift) => shift.driver, { cascade: true })
  shifts?: Shift[];

  /**
   * Bidirectional 1:N relationship with Contract
   * A driver can have multiple contracts with companies
   * Contract acts as an intermediate table for the N:N relationship with Company
   */
  @OneToMany(() => Contract, (contract) => contract.driver, { cascade: true })
  contracts?: Contract[];

  constructor(person_id: string) {
    super(person_id);
    this.person_id = person_id;
  }
}
