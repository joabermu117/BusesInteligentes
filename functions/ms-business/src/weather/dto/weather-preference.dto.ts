import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateWeatherPreferenceDto {
  @IsString()
  citizenId?: string;

  @IsOptional()
  @IsBoolean()
  weatherAlertsEnabled?: boolean;

  @IsOptional()
  @IsString()
  habitualTravelTime?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  preferredChannel?: string;
}

export class UpdateWeatherPreferenceDto {
  @IsOptional()
  @IsBoolean()
  weatherAlertsEnabled?: boolean;

  @IsOptional()
  @IsString()
  habitualTravelTime?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  preferredChannel?: string;
}
