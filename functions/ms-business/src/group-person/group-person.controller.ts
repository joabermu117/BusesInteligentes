import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateGroupPersonDto } from './dto/create-group-person.dto';
import { UpdateGroupPersonDto } from './dto/update-group-person.dto';
import { GroupPersonService } from './group-person.service';

@Controller('api/group-persons')
export class GroupPersonController {
  constructor(private readonly groupPersonService: GroupPersonService) {}

  @Post()
  create(@Body() createGroupPersonDto: CreateGroupPersonDto) {
    return this.groupPersonService.create(createGroupPersonDto);
  }

  @Get()
  findAll() {
    return this.groupPersonService.findAll();
  }

  @Get(':group_id/:person_id')
  findOne(@Param('group_id') group_id: string, @Param('person_id') person_id: string) {
    return this.groupPersonService.findOne(+group_id, person_id);
  }

  @Put(':group_id/:person_id')
  update(
    @Param('group_id') group_id: string,
    @Param('person_id') person_id: string,
    @Body() updateGroupPersonDto: UpdateGroupPersonDto,
  ) {
    return this.groupPersonService.update(+group_id, person_id, updateGroupPersonDto);
  }

  @Delete(':group_id/:person_id')
  remove(@Param('group_id') group_id: string, @Param('person_id') person_id: string) {
    return this.groupPersonService.remove(+group_id, person_id);
  }
}
