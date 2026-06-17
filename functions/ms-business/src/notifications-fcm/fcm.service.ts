import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import * as path from 'path';
import { FcmToken } from './entities/fcm-token.entity';

let firebaseApp: App | null = null;

const getFirebaseApp = (): App | null => {
  if (firebaseApp) return firebaseApp;
  const existing = getApps();
  if (existing.length > 0) {
    firebaseApp = existing[0];
    return firebaseApp;
  }

  try {
    const credentialPath = path.resolve(
      process.cwd(),
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 'firebase-service-account.json',
    );
    firebaseApp = initializeApp({
      credential: cert(require(credentialPath)),
    });
    return firebaseApp;
  } catch (err) {
    new Logger('FcmService').warn(
      `No se pudo inicializar firebase-admin: ${(err as Error).message}`,
    );
    return null;
  }
};

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepo: Repository<FcmToken>,
  ) {}

  async registerToken(personId: string, fcmToken: string): Promise<{ message: string }> {
    let existing = await this.fcmTokenRepo.findOne({
      where: { fcmToken },
    });

    if (existing) {
      existing.personId = personId;
      existing.updated_at = new Date();
      await this.fcmTokenRepo.save(existing);
    } else {
      await this.fcmTokenRepo.save(
        this.fcmTokenRepo.create({ personId, fcmToken }),
      );
    }

    return { message: 'Token registrado correctamente' };
  }

  async getTokensByPerson(personId: string): Promise<string[]> {
    const tokens = await this.fcmTokenRepo.find({ where: { personId } });
    return tokens.map((t) => t.fcmToken!);
  }

  async getAllTokens(): Promise<string[]> {
    const tokens = await this.fcmTokenRepo.find();
    return tokens.map((t) => t.fcmToken!);
  }

  private async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (tokens.length === 0) return;
    const app = getFirebaseApp();
    if (!app) return;

    try {
      const response = await getMessaging(app).sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data ?? {},
      });

      const invalidTokens: string[] = [];
      response.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = r.error?.code;
          if (
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await this.fcmTokenRepo.delete({ fcmToken: In(invalidTokens) });
      }
    } catch (err) {
      this.logger.warn(`Error al enviar push FCM: ${(err as Error).message}`);
    }
  }

  async sendPushToUser(
    personId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokens = await this.getTokensByPerson(personId);
    await this.sendToTokens(tokens, title, body, data);
  }

  async sendPushToMany(
    personIds: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (personIds.length === 0) return;
    const tokens = await this.fcmTokenRepo
      .createQueryBuilder('t')
      .where('t.personId IN (:...ids)', { ids: personIds })
      .getMany();
    await this.sendToTokens(tokens.map((t) => t.fcmToken!), title, body, data);
  }
}
