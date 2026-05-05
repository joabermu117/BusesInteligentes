import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';
import { Contract } from '../../contract/entities/contract.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ unique: true })
  nit?: string;

  @Column()
  nombre?: string;

  @Column({ nullable: true })
  direccion?: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ default: true })
  activa?: boolean;

  /**
   * Bidirectional 1:N relationship with Bus
   * A company can have many buses
   */
  @OneToMany(() => Bus, (bus) => bus.company, { cascade: true })
  buses?: Bus[];

  /**
   * Bidirectional 1:N relationship with Contract
   * A company can have many contracts with drivers
   */
  @OneToMany(() => Contract, (contract) => contract.company, { cascade: true })
  contracts?: Contract[];
}