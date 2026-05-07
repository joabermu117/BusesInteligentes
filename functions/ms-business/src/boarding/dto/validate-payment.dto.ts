import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class ValidatePaymentDto {
  @IsString()
  @IsNotEmpty()
  citizenId: string;

  @IsNumber()
  paymentMethodId: number;
}
