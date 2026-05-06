import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './group.service';
import { GroupPersonService } from '../group-person/group-person.service';
import { CreateGroupPersonDto } from '../group-person/dto/create-group-person.dto';

@Controller('api/grupos')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly groupPersonService: GroupPersonService,
  ) {}

  @Post()
  create(@Body() createGroupDto: CreateGroupDto) {
    return this.groupService.create(createGroupDto);
  }

  @Get()
  findAll() {
    return this.groupService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto) {
    return this.groupService.update(+id, updateGroupDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupService.remove(+id);
  }

  // ─── Endpoints anidados: personas del grupo ───

  @Post(':id/personas')
  addPerson(
    @Param('id') id: string,
    @Body() createGroupPersonDto: CreateGroupPersonDto,
  ) {
    return this.groupPersonService.create({
      ...createGroupPersonDto,
      group_id: +id,
    });
  }

  @Get(':id/personas')
  findPersons(@Param('id') id: string) {
    return this.groupPersonService.findByGroup(+id);
  }

  @Delete(':id/personas/:pid')
  removePerson(
    @Param('id') id: string,
    @Param('pid') pid: string,
  ) {
    return this.groupPersonService.remove(+id, pid);
  }
}
