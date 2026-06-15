import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendGroupMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  sender_person_id: string;

  @IsArray()
  @IsNumber({}, { each: true })
  group_ids: number[];

  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;
}
