import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';

import { IsNumber, IsDate, IsOptional, IsEnum } from 'class-validator';

export class CreateScheduleDto {
  @IsNumber()
  busId: number;

  @IsNumber()
  routeId: number;

  @IsDate()
  departureTime: Date;

  @IsOptional()
  @IsNumber()
  toleranceMinutes?: number;

  @IsOptional()
  @IsEnum(['scheduled', 'in_progress', 'completed', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsEnum(['none', 'weekdays', 'weekends', 'daily'])
  recurrence?: string;

  @IsOptional()
  @IsDate()
  date?: Date;
}
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