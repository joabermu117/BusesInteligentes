import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('fcm_tokens')
export class FcmToken {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 255 })
  userId?: string;

  @Column({ type: 'text' })
  fcmToken?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at?: Date;
}
