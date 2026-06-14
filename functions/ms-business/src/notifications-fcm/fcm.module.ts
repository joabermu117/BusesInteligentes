import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FcmController } from './fcm.controller';
import { FcmService } from './fcm.service';
import { FcmToken } from './entities/fcm-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FcmToken])],
  controllers: [FcmController],
  providers: [FcmService],
  exports: [FcmService],
})
export class FcmModule {}
