import { IsOptional, IsString, IsEnum } from 'class-validator';

export class StartShiftDto {
  @IsOptional()
  @IsEnum(['operative', 'maintenance', 'out_of_service'])
  busCondition?: string;

  @IsOptional()
  @IsString()
  observations?: string;
}
