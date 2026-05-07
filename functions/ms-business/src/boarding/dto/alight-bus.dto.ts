import { IsNumber } from 'class-validator';

export class AlightBusDto {
  @IsNumber()
  ticketId: number;

  @IsNumber()
  stopId: number;
}
