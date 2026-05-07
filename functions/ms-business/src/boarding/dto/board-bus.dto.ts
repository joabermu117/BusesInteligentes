import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class BoardBusDto {
  @IsString()
  @IsNotEmpty()
  citizenId: string;

  @IsNumber()
  scheduleId: number;

  @IsNumber()
  paymentMethodId: number;

  @IsNumber()
  stopId: number;
}
