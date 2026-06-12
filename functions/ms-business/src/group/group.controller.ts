import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CreateGroupPersonDto } from '../group-person/dto/create-group-person.dto';
import { GroupPersonService } from '../group-person/group-person.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupService } from './group.service';

@Controller('api/groups')
export class GroupController {
  constructor(
    private readonly groupService: GroupService,
    private readonly groupPersonService: GroupPersonService,
  ) {}

  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupService.create(dto);
  }

  @Get()
  findAll() {
    return this.groupService.findAll();
  }

  @Get('public')
  findPublic(@Query('search') search?: string) {
    return this.groupService.findPublic(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupService.remove(+id);
  }

  @Post(':id/persons')
  addPerson(@Param('id') id: string, @Body() dto: CreateGroupPersonDto) {
    return this.groupPersonService.create({ ...dto, group_id: +id });
  }

  @Get(':id/persons')
  findPersons(@Param('id') id: string) {
    return this.groupPersonService.findByGroup(+id);
  }

  @Get(':id/log')
  getMembershipLog(@Param('id') id: string) {
    return this.groupPersonService.getMembershipLog(+id);
  }

  @Patch(':id/persons/:pid/promote')
  promote(
    @Param('id') id: string,
    @Param('pid') pid: string,
    @Body('action_by') actionBy: string,
  ) {
    return this.groupPersonService.promote(+id, pid, actionBy);
  }

  @Patch(':id/persons/:pid/block')
  block(
    @Param('id') id: string,
    @Param('pid') pid: string,
    @Body('action_by') actionBy: string,
  ) {
    return this.groupPersonService.block(+id, pid, actionBy);
  }

  @Delete(':id/persons/:pid')
  removePerson(
    @Param('id') id: string,
    @Param('pid') pid: string,
    @Body('action_by') actionBy: string,
  ) {
    return this.groupPersonService.remove(+id, pid, actionBy);
  }
}