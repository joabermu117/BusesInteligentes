import { Body, Controller, Post } from '@nestjs/common';
import { FcmService } from './fcm.service';

@Controller('api/notifications/fcm')
export class FcmController {
  constructor(private readonly fcmService: FcmService) {}

  @Post('register')
  async registerToken(@Body() dto: { personId: string; fcmToken: string }) {
    return this.fcmService.registerToken(dto.personId, dto.fcmToken);
  }
}
