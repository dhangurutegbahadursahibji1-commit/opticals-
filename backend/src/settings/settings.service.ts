import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogService) {}

  async findAll() {
    const settings = await this.prisma.setting.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  async get(key: string) {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    return setting?.value ?? null;
  }

  async set(key: string, value: unknown, actorId: string) {
    const setting = await this.prisma.setting.upsert({
      where: { key },
      create: { key, value: value as any },
      update: { value: value as any },
    });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'setting', resourceId: key });
    return setting;
  }
}
