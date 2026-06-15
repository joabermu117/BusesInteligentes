import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FcmToken } from './entities/fcm-token.entity';

@Injectable()
export class FcmService {
  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepo: Repository<FcmToken>,
  ) {}

  async registerToken(userId: string, fcmToken: string): Promise<{ message: string }> {
    let existing = await this.fcmTokenRepo.findOne({
      where: { userId, fcmToken },
    });

    if (existing) {
      existing.updated_at = new Date();
      await this.fcmTokenRepo.save(existing);
    } else {
      await this.fcmTokenRepo.save(
        this.fcmTokenRepo.create({ userId, fcmToken }),
      );
    }

    return { message: 'Token registrado correctamente' };
  }

  async getTokensByUser(userId: string): Promise<string[]> {
    const tokens = await this.fcmTokenRepo.find({ where: { userId } });
    return tokens.map((t) => t.fcmToken!);
  }

  async getAllTokens(): Promise<string[]> {
    const tokens = await this.fcmTokenRepo.find();
    return tokens.map((t) => t.fcmToken!);
  }
}
