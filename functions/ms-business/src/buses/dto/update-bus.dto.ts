import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';
import { CreateBusDto } from './create-bus.dto';

export class UpdateBusDto extends PartialType(CreateBusDto) {
  /**
   * Acepta `photoUrl` legacy desde el frontend (se mapea a photo en el service)
   */
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
