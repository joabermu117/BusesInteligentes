import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateCitizenPaymentMethodDto {
  @IsNumber()
  citizenId: number;

  @IsNumber()
  paymentMethodId: number;

  @IsOptional()
  @IsString()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardHolder?: string;

  @IsOptional()
  @IsDate()
  expirationDate?: Date;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
