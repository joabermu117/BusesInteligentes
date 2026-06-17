import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SendPersonalMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'El mensaje no puede superar los 500 caracteres' })
  content: string;

  @IsString()
  @IsNotEmpty()
  sender_person_id: string;

  @IsArray()
  @IsString({ each: true })
  recipient_person_ids: string[];

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;
}
