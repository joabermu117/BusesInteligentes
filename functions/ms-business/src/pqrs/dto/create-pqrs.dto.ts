import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePqrsDto {
  @IsEnum(['Petición', 'Queja', 'Reclamo', 'Sugerencia'])
  tipo!: string;

  @IsEnum(['Conductor', 'Bus', 'Ruta', 'Tarjeta', 'Otro'])
  categoria!: string;

  @IsString()
  @MaxLength(500)
  descripcion!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  fotos?: string[];
}

export class UpdatePqrsEstadoDto {
  @IsEnum(['recibido', 'en_revision', 'en_proceso', 'resuelto'])
  estado!: string;

  @IsOptional()
  @IsString()
  respuesta?: string;
}