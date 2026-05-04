import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesModule } from './companies/companies.module';
import { BusesModule } from './buses/buses.module';
import { GpsModule } from './gps/gps.module';
import { ShiftsModule } from './shifts/shifts.module';
import { IncidentsModule } from './incidents/incidents.module';
import { IncidentsBusesModule } from './incidents-buses/incidents-buses.module';
import { PhotosModule } from './photos/photos.module';
import { SchedulesModule } from './schedules/schedules.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
      }),
    }),
    CompaniesModule,
    BusesModule,
    GpsModule,
    ShiftsModule,
    IncidentsModule,
    IncidentsBusesModule,
    PhotosModule,
    SchedulesModule,
  ],
})
export class AppModule {}