import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';

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

  @OneToMany(() => Bus, (bus) => bus.company, { cascade: true })
  buses?: Bus[];
}