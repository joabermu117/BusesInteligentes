import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGroupPersonDto {
  @IsNumber()
  @IsNotEmpty()
  group_id: number;

  @IsString()
  @IsNotEmpty()
  person_id: string;

  @IsOptional()
  joined_at?: Date;

  @IsEnum(['admin', 'member'])
  role: string;
}
