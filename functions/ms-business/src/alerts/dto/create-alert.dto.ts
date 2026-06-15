import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAlertDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  sender_person_id: string;

  @IsEnum(['all', 'route', 'zone'])
  scope: 'all' | 'route' | 'zone';

  @IsOptional()
  @IsString()
  scope_value?: string;

  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;

  @IsOptional()
  @IsString()
  scheduled_at?: string;
}
