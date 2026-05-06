import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  sender_person_id: string;

  @IsEnum(['personal', 'group'])
  @IsNotEmpty()
  message_type: string;
}
