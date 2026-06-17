import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('weather_preferences')
export class WeatherPreference {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ type: 'varchar', length: 255, default: '' })
  citizenId?: string;

  @Column({ default: false })
  weatherAlertsEnabled?: boolean;

  @Column({ type: 'varchar', length: 20, default: '07:00' })
  habitualTravelTime?: string;

  @Column({ type: 'varchar', length: 100, default: 'Manizales' })
  city?: string;

  @Column({ type: 'varchar', length: 50, default: 'push' })
  preferredChannel?: string; // 'email', 'whatsapp', 'push'

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ default: true })
  active?: boolean;
}
