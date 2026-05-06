import { IsEnum, IsInt, IsLatitude, IsLongitude, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateNodeDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsEnum(['stop', 'waypoint'])
  @IsNotEmpty()
  type: string;

  @IsInt()
  @Min(0)
  sequence_order: number;

  @IsNumber()
  route_id: number;
}
