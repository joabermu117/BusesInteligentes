import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';
import { SendPersonalMessageDto } from './dto/send-personal-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';

@Controller('api/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // ─── Specific named routes first (before :id catch-all) ───────────────────────

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('personal')
  sendPersonal(
    @Body() dto: SendPersonalMessageDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.messageService.sendPersonal(dto, auth?.replace('Bearer ', ''));
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('group')
  sendToGroup(
    @Body() dto: SendGroupMessageDto,
    @Headers('authorization') auth?: string,
  ) {
    return this.messageService.sendToGroup(dto, auth?.replace('Bearer ', ''));
  }

  @Get('inbox/:personId/unread-count')
  getUnreadCount(@Param('personId') personId: string) {
    return this.messageService.getUnreadCount(personId);
  }

  @Get('inbox/:personId')
  getInbox(
    @Param('personId') personId: string,
    @Query('type') type?: string,
    @Query('unread') unread?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.messageService.getInbox(
      personId,
      type,
      unread === 'true',
      page ? Math.max(1, +page) : 1,
      limit ? Math.min(100, Math.max(1, +limit)) : 50,
      dateFrom,
      dateTo,
    );
  }

  @Get('sent/:personId')
  getSent(
    @Param('personId') personId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messageService.getSent(
      personId,
      page ? Math.max(1, +page) : 1,
      limit ? Math.min(100, Math.max(1, +limit)) : 50,
    );
  }

  // ─── Generic CRUD ─────────────────────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.messageService.create(dto);
  }

  @Get()
  findAll() {
    return this.messageService.findAll();
  }

  @Get(':id/read-receipts')
  getReadReceipts(@Param('id') id: string) {
    return this.messageService.getReadReceipts(+id);
  }

  @Patch(':id/read-group')
  markGroupRead(
    @Param('id') id: string,
    @Body() body: { group_id: number; person_id: string },
  ) {
    return this.messageService.markGroupMessageRead(+id, body.group_id, body.person_id);
  }

  @Delete(':id/group/:groupId')
  removeGroupMessage(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
    @Body() body: { actor_person_id: string },
  ) {
    return this.messageService.removeGroupMessage(+id, +groupId, body.actor_person_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.messageService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMessageDto) {
    return this.messageService.update(+id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.messageService.remove(+id);
  }
}
