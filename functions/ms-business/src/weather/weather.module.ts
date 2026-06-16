import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherPreference } from './entities/weather-preference.entity';
import { NotificationsModule } from '../gateways/notifications/notifications.module';
import { TrackingModule } from '../gateways/tracking/tracking.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WeatherPreference]),
    ScheduleModule.forRoot(),
    NotificationsModule,
    TrackingModule,
  ],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}
