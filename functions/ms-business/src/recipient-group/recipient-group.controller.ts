import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateRecipientGroupDto } from './dto/create-recipient-group.dto';
import { UpdateRecipientGroupDto } from './dto/update-recipient-group.dto';
import { RecipientGroupService } from './recipient-group.service';

@Controller('api/recipient-groups')
export class RecipientGroupController {
  constructor(private readonly recipientGroupService: RecipientGroupService) {}

  @Post()
  create(@Body() createRecipientGroupDto: CreateRecipientGroupDto) {
    return this.recipientGroupService.create(createRecipientGroupDto);
  }

  @Get()
  findAll() {
    return this.recipientGroupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipientGroupService.findOne(+id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateRecipientGroupDto: UpdateRecipientGroupDto,
  ) {
    return this.recipientGroupService.update(+id, updateRecipientGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recipientGroupService.remove(+id);
  }
}
