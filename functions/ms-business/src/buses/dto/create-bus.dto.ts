import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBusDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  plate?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  model?: string;

  @IsInt()
  @Min(1990)
  @Max(2030)
  year?: number;

  @IsInt()
  @Min(1)
  @Max(200)
  totalCapacity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  seatedCapacity?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  standingCapacity?: number;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsEnum(['operative', 'maintenance', 'out_of_service'])
  status?: string;

  @IsNumber()
  companyId?: number;
}
