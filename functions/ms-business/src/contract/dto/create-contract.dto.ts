import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateContractDto {
  @IsString()
  person_id: string;

  @IsNumber()
  companyId: number;

  @IsOptional()
  @IsString()
  contractNumber?: string;

  @IsDate()
  startDate: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsEnum(['active', 'inactive', 'suspended', 'terminated'])
  status?: string;

  @IsOptional()
  salary?: number;

  @IsOptional()
  @IsString()
  conditions?: string;
}
