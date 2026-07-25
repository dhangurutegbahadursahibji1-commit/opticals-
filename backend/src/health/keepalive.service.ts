// backend/src/app.module.ts — add ScheduleModule is already there, just add this service

// backend/src/health/keepalive.service.ts  (new file)
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class KeepaliveService {
  private readonly logger = new Logger(KeepaliveService.name);

  @Cron('*/14 * * * *') // every 14 minutes
  async ping() {
    const url = process.env.SELF_URL;
    if (!url || process.env.NODE_ENV !== 'production') return;
    try {
      await fetch(`${url}/api/health`);
      this.logger.debug('Keepalive ping sent');
    } catch {
      // silent — don't crash the cron
    }
  }
}