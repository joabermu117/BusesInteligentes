import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCitizenPaymentMethodDto {
  @IsString()
  citizenId: string;

  @IsNumber()
  paymentMethodId: number;

  @IsOptional()
  @IsString()
  cardNumber?: string;

  @IsOptional()
  @IsString()
  cardHolder?: string;

  @IsOptional()
  @IsDateString()
  expirationDate?: Date;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
