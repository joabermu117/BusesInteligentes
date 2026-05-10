import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateShiftDto {
  @IsOptional()
  @IsInt()
  driverId?: number;

  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsEnum(['scheduled', 'in_progress', 'finished', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsString()
  busCondition?: string;

  @IsNumber()
  busId?: number;
}