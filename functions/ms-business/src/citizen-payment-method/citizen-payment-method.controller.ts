import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CitizenPaymentMethodService } from './citizen-payment-method.service';
import { CreateCitizenPaymentMethodDto } from './dto/create-citizen-payment-method.dto';
import { UpdateCitizenPaymentMethodDto } from './dto/update-citizen-payment-method.dto';

@Controller('api/citizen-payment-methods')
export class CitizenPaymentMethodController {
  constructor(private readonly citizenPaymentMethodService: CitizenPaymentMethodService) {}

  @Post()
  create(@Body() createCitizenPaymentMethodDto: CreateCitizenPaymentMethodDto) {
    return this.citizenPaymentMethodService.create(createCitizenPaymentMethodDto);
  }

  @Get()
  findAll() {
    return this.citizenPaymentMethodService.findAll();
    @Get('citizen/:citizenId')
    findByCitizen(@Param('citizenId') citizenId: string) {
      return this.citizenPaymentMethodService.findByCitizen(+citizenId);
    }

  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.citizenPaymentMethodService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCitizenPaymentMethodDto: UpdateCitizenPaymentMethodDto) {
    return this.citizenPaymentMethodService.update(+id, updateCitizenPaymentMethodDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.citizenPaymentMethodService.remove(+id);
  }
}
