import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateRouteStopDto {
  @IsInt()
  @IsNotEmpty()
  route_id?: number;

  @IsInt()
  @IsNotEmpty()
  stop_id?: number;

  @IsInt()
  @Min(1)
  order_index?: number;
}