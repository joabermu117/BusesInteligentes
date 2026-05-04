import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateIncidentBusDto {
  @IsOptional()
  @IsString()
  driverUserId?: string;

  @IsOptional()
  @IsNumber()
  shiftId?: number;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsNumber()
  busId?: number;

  @IsNumber()
  incidentId?: number;
}