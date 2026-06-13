import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherPreference } from './entities/weather-preference.entity';
import { NotificationsModule } from '../gateways/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WeatherPreference]),
    ScheduleModule.forRoot(),
    NotificationsModule,
  ],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}
