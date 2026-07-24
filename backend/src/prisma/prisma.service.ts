import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL via Prisma');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /** Soft-delete helper: sets deletedAt + purgeAt (7-day recycle bin window). */
  softDeleteData(days = 7) {
    const now = new Date();
    const purgeAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return { deletedAt: now, purgeAt };
  }
}
