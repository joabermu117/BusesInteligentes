import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRecipientPersonDto {
  @IsNumber()
  @IsNotEmpty()
  message_id: number;

  @IsString()
  @IsNotEmpty()
  recipient_person_id: string;

  @IsOptional()
  read_at?: Date;
}
