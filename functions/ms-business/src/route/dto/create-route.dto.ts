import { IsBoolean, IsNotEmpty, IsNumber, IsString, MaxLength, Min } from 'class-validator';

export class CreateRouteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  origin: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  destination: string;

  @IsNumber()
  @Min(0)
  distance: number;

  @IsNumber()
  @Min(1)
  estimated_duration: number;

  @IsBoolean()
  is_active: boolean;
}
