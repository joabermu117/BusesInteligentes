import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CitizenService } from './citizen.service';
import { CreateCitizenDto } from './dto/create-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';

@Controller('api/citizens')
export class CitizenController {
  constructor(private readonly citizenService: CitizenService) {}

  @Post()
  create(@Body() createCitizenDto: CreateCitizenDto) {
    return this.citizenService.create(createCitizenDto);
  }

  @Post('activate')
  activate(@Body() body: { person_id: string; name?: string; birthDate?: string }) {
    return this.citizenService.activate(body.person_id, body.name, body.birthDate);
  }

  @Patch(':person_id/deactivate')
  deactivate(@Param('person_id') person_id: string) {
    return this.citizenService.deactivate(person_id);
  }

  @Get()
  findAll() {
    return this.citizenService.findAll();
  }

  @Get(':person_id')
  findOne(@Param('person_id') person_id: string) {
    return this.citizenService.findOne(person_id);
  }

  @Patch(':person_id')
  update(
    @Param('person_id') person_id: string,
    @Body() updateCitizenDto: UpdateCitizenDto,
  ) {
    return this.citizenService.update(person_id, updateCitizenDto);
  }

  @Delete(':person_id')
  remove(@Param('person_id') person_id: string) {
    return this.citizenService.remove(person_id);
  }
}
