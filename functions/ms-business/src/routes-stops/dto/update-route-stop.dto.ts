import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateRouteStopDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  order_index?: number;
}