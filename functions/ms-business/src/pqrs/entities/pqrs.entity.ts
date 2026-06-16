import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('pqrs')
export class Pqrs {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  radicado?: string;

  @Column({ type: 'varchar', length: 50 })
  tipo?: string;

  @Column({ type: 'varchar', length: 50 })
  categoria?: string;

  @Column({ type: 'text' })
  descripcion?: string;

  @Column({ type: 'varchar', length: 255 })
  email?: string;

  @Column({
    type: 'enum',
    enum: ['recibido', 'en_revision', 'en_proceso', 'resuelto'],
    default: 'recibido',
  })
  estado?: string;

  @Column({ type: 'longtext', nullable: true })
  fotos?: string;

  @Column({ type: 'text', nullable: true })
  respuesta?: string;

  @Column({ type: 'varchar', length: 50, default: '5 días hábiles' })
  tiempoRespuesta?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deadlineAt?: Date;
}