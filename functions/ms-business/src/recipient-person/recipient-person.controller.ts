import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateRecipientPersonDto } from './dto/create-recipient-person.dto';
import { UpdateRecipientPersonDto } from './dto/update-recipient-person.dto';
import { RecipientPersonService } from './recipient-person.service';

@Controller('api/destinatarios-persona')
export class RecipientPersonController {
  constructor(private readonly recipientPersonService: RecipientPersonService) {}

  @Post()
  create(@Body() createRecipientPersonDto: CreateRecipientPersonDto) {
    return this.recipientPersonService.create(createRecipientPersonDto);
  }

  @Get()
  findAll() {
    return this.recipientPersonService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipientPersonService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecipientPersonDto: UpdateRecipientPersonDto,
  ) {
    return this.recipientPersonService.update(+id, updateRecipientPersonDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recipientPersonService.remove(+id);
  }
}
