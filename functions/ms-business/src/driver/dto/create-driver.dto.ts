import { IsDate, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDriverDto {
  @IsString()
  @MinLength(24)
  @MaxLength(24)
  person_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @IsOptional()
  @IsDate()
  licenseExpiration?: Date;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended'])
  status?: string;
}
