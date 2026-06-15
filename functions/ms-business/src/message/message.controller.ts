import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { SendGroupMessageDto } from './dto/send-group-message.dto';
import { SendPersonalMessageDto } from './dto/send-personal-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageService } from './message.service';

@Controller('api/messages')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  // ─── Specific named routes first (before :id catch-all) ───────────────────────

  @Post('personal')
  sendPersonal(@Body() dto: SendPersonalMessageDto) {
    return this.messageService.sendPersonal(dto);
  }

  @Post('group')
  sendToGroup(@Body() dto: SendGroupMessageDto) {
    return this.messageService.sendToGroup(dto);
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
  ) {
    return this.messageService.getInbox(
      personId,
      type,
      unread === 'true',
      page ? Math.max(1, +page) : 1,
      limit ? Math.min(100, Math.max(1, +limit)) : 50,
    );
  }

  @Get('sent/:personId')
  getSent(@Param('personId') personId: string) {
    return this.messageService.getSent(personId);
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
