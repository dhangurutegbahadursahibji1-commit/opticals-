import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';

export interface RecordAuditLogInput {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// Every mutating action across the platform funnels through here — see spec:
// "Record every action. Login, Logout, Create, Update, Delete, Restore, Upload,
// Download, Archive, Publish, Failed Login."
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(input: RecordAuditLogInput): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          metadata: input.metadata as any,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch (err) {
      // Audit logging must never break the primary request flow.
      this.logger.error(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  async findAll(query: PaginationQueryDto & { resource?: string; action?: string; userId?: string }) {
    const { page: _page, limit: _limit, resource, action, userId } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = {
      ...(resource && { resource }),
      ...(action && { action }),
      ...(userId && { userId }),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }
}