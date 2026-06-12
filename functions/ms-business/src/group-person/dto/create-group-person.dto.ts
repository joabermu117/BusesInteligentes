import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateGroupPersonDto {
  @IsOptional()
  @IsNumber()
  group_id?: number;

  @IsString()
  person_id?: string;

  @IsOptional()
  joined_at?: Date;

  @IsOptional()
  @IsEnum(['admin', 'member'])
  role?: string;
}