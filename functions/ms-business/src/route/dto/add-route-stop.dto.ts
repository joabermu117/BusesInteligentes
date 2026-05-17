import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class AddRouteStopDto {
  @IsInt()
  @IsNotEmpty()
  stop_id: number;

  @IsInt()
  @Min(1)
  order_index: number;
}
