import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../../companies/entities/company.entity';
import { Driver } from '../../driver/entities/driver.entity';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  contractNumber?: string;

  @Column()
  startDate?: Date;

  @Column({ nullable: true })
  endDate?: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'inactive', 'suspended', 'terminated'],
    default: 'active',
  })
  status?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary?: number;

  @Column({ type: 'text', nullable: true })
  conditions?: string;

  /**
   * Bidirectional N:1 relationship with Driver
   * Many contracts belong to one driver
   * Contract acts as an intermediate table for the N:N relationship with Company
   */
  @ManyToOne(() => Driver, (driver) => driver.contracts)
  driver?: Driver;

  /**
   * Bidirectional N:1 relationship with Company
   * Many contracts belong to one company
   */
  @ManyToOne(() => Company, (company) => company.contracts)
  company?: Company;
}
