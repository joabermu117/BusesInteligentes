import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CreatePqrsDto, UpdatePqrsEstadoDto } from './dto/create-pqrs.dto';
import { PqrsService } from './pqrs.service';

@Controller('api/public/pqrs')
export class PqrsController {
  constructor(private readonly pqrsService: PqrsService) {}

  @Post()
  create(@Body() dto: CreatePqrsDto) {
    return this.pqrsService.create(dto);
  }

  @Get()
  findAll() {
    return this.pqrsService.findAll();
  }

  @Get(':radicado')
  findOne(@Param('radicado') radicado: string) {
    return this.pqrsService.findByRadicado(radicado);
  }

  @Patch(':radicado/estado')
  updateEstado(
    @Param('radicado') radicado: string,
    @Body() dto: UpdatePqrsEstadoDto,
  ) {
    return this.pqrsService.updateEstado(radicado, dto);
  }

  @Get('vencidos/lista')
  findVencidos() {
    return this.pqrsService.findVencidos();
  }
}