import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressModule } from './address/address.module';
import { BoardingModule } from './boarding/boarding.module';
import { BusesModule } from './buses/buses.module';
import { CitizenPaymentMethodModule } from './citizen-payment-method/citizen-payment-method.module';
import { CitizenModule } from './citizen/citizen.module';
import { CompaniesModule } from './companies/companies.module';
import { ContractModule } from './contract/contract.module';
import { DriverModule } from './driver/driver.module';
import { NotificationsModule } from './gateways/notifications/notifications.module';
import { GpsModule } from './gps/gps.module';
import { GroupModule } from './group/group.module';
import { SecurityGuard } from './guards/security/security.guard';
import { HistoryModule } from './history/history.module';
import { IncidentsBusesModule } from './incidents-buses/incidents-buses.module';
import { IncidentsModule } from './incidents/incidents.module';
import { MessageModule } from './message/message.module';
import { NodeModule } from './node/node.module';
import { PaymentMethodModule } from './payment-method/payment-method.module';
import { PersonModule } from './person/person.module';
import { PhotosModule } from './photos/photos.module';
import { RecipientGroupModule } from './recipient-group/recipient-group.module';
import { RecipientPersonModule } from './recipient-person/recipient-person.module';
import { RouteModule } from './route/route.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ShiftsModule } from './shifts/shifts.module';
import { StopModule } from './stop/stop.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  providers: [{ provide: APP_GUARD, useClass: SecurityGuard }],
  imports: [
    NotificationsModule,
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
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        synchronize: true,
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
    PersonModule,
    CitizenModule,
    DriverModule,
    AddressModule,
    PaymentMethodModule,
    CitizenPaymentMethodModule,
    TicketModule,
    HistoryModule,
    ContractModule,
    RouteModule,
    StopModule,
    NodeModule,
    MessageModule,
    RecipientPersonModule,
    RecipientGroupModule,
    GroupModule,
    BoardingModule,
  ],
})
export class AppModule {}
