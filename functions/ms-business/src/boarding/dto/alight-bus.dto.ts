import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class AlightBusDto {
  @IsNumber()
  ticketId: number;

  @IsNumber()
  stopId: number;

  @IsString()
  @IsNotEmpty()
  citizenId: string;
}
