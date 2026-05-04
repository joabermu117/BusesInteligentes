import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateScheduleDto {
  @IsNumber()
  routeId?: number;

  @IsDateString()
  departureTime?: string;

  @IsDateString()
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  toleranceMinutes?: number;

  @IsOptional()
  @IsEnum(['scheduled', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsEnum(['none', 'weekdays', 'weekends', 'daily'])
  recurrence?: string;

  @IsNumber()
  busId?: number;
}