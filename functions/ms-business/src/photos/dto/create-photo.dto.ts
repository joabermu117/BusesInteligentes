import { IsNumber, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreatePhotoDto {
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsNumber()
  incidentBusId?: number;
}