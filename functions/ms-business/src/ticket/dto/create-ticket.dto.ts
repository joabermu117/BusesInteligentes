import { IsBoolean, IsDate, IsDecimal, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsNumber()
  citizenId: number;

  @IsNumber()
  scheduleId: number;

  @IsOptional()
  @IsNumber()
  paymentMethodId?: number;

  @IsOptional()
  @IsString()
  ticketNumber?: string;

  @IsOptional()
  @IsEnum(['issued', 'used', 'expired', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsDate()
  issuedDate?: Date;

  @IsOptional()
  @IsDate()
  expirationDate?: Date;

  @IsOptional()
  price?: number;

  @IsOptional()
  @IsString()
  qrCode?: string;

  @IsOptional()
  @IsBoolean()
  isBoardingPass?: boolean;
}
