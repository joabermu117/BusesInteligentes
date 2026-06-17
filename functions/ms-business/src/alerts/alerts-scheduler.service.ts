import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { NotificationsGateway } from '../gateways/notifications/notifications.gateway';
import { FcmService } from '../notifications-fcm/fcm.service';
import { Message } from '../message/entities/message.entity';
import { RecipientPerson } from '../recipient-person/entities/recipient-person.entity';

@Injectable()
export class AlertsSchedulerService {
  private readonly logger = new Logger(AlertsSchedulerService.name);

  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(RecipientPerson)
    private readonly recipientPersonRepo: Repository<RecipientPerson>,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly fcmService: FcmService,
  ) {}

  @Cron('*/30 * * * * *')
  async processScheduledAlerts() {
    const pendingAlerts = await this.messageRepo.find({
      where: {
        message_type: 'mass_alert',
        is_readonly: true,
        is_dispatched: false,
        scheduled_at: LessThanOrEqual(new Date()),
      },
      relations: ['sender'],
    });

    if (pendingAlerts.length === 0) return;

    this.logger.log(`Processing ${pendingAlerts.length} scheduled mass alert(s)`);

    for (const alert of pendingAlerts) {
      try {
        const recipients = await this.recipientPersonRepo.find({
          where: { message_id: alert.id },
        });

        const recipientIds = recipients
          .map((rp) => rp.recipient_person_id)
          .filter((id): id is string => !!id);

        this.notificationsGateway.sendToMany(recipientIds, 'mass-alert', {
          messageId: alert.id,
          content: alert.content,
          is_urgent: alert.is_urgent,
          senderName: alert.sender?.name,
        });

        if (alert.is_urgent) {
          this.notificationsGateway.broadcastNotification({
            type: 'urgent-alert',
            messageId: alert.id,
            content: alert.content,
          });
        }

        this.fcmService.sendPushToMany(
          recipientIds,
          alert.is_urgent ? 'ALERTA URGENTE' : 'Alerta',
          alert.content ?? '',
          { type: 'mass_alert', messageId: String(alert.id), is_urgent: String(!!alert.is_urgent) },
        );

        alert.is_dispatched = true;
        await this.messageRepo.save(alert);

        this.logger.log(`Alert #${alert.id} dispatched to ${recipientIds.length} recipient(s)`);
      } catch (err) {
        this.logger.error(`Failed to dispatch alert #${alert.id}: ${(err as Error).message}`);
      }
    }
  }
}
