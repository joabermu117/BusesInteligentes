import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateIncidentDto {
  @IsEnum(['mechanical', 'accident', 'delay', 'other'])
  type?: string;

  @IsEnum(['low', 'medium', 'high', 'critical'])
  severity?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['pending', 'in_review', 'resolved'])
  status?: string;

  @IsOptional()
  @IsDateString()
  reportedAt?: string;

  @IsOptional()
  @IsString()
  supervisorComment?: string;
}