import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class CreateRecipientGroupDto {
  @IsNumber()
  @IsNotEmpty()
  message_id: number;

  @IsNumber()
  @IsNotEmpty()
  group_id: number;

  @IsOptional()
  delivered_at?: Date;
}
