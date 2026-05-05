import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateHistoryDto {
  @IsNumber()
  ticketId: number;

  @IsString()
  personId: string;

  @IsOptional()
  @IsDate()
  timestamp?: Date;

  @IsEnum(['created', 'updated', 'deleted', 'boarded', 'validated'])
  action: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  nodeId?: string;
}
