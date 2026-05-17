import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCitizenDto {
  @IsString()
  @MinLength(24)
  @MaxLength(24)
  person_id: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
