import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { DriverService } from './driver.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Controller('api/drivers')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  create(@Body() createDriverDto: CreateDriverDto) {
    return this.driverService.create(createDriverDto);
  }

  @Post('activate')
  activate(@Body() body: { person_id: string }) {
    return this.driverService.activate(body.person_id);
  }

  @Patch(':person_id/deactivate')
  deactivate(@Param('person_id') person_id: string) {
    return this.driverService.deactivate(person_id);
  }

  @Get()
  findAll() {
    return this.driverService.findAll();
  }

  @Get(':person_id')
  findOne(@Param('person_id') person_id: string) {
    return this.driverService.findOne(person_id);
  }

  @Patch(':person_id')
  update(
    @Param('person_id') person_id: string,
    @Body() updateDriverDto: UpdateDriverDto,
  ) {
    return this.driverService.update(person_id, updateDriverDto);
  }

  @Delete(':person_id')
  remove(@Param('person_id') person_id: string) {
    return this.driverService.remove(person_id);
  }
}
