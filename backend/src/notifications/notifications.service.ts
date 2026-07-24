import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(type: NotificationType, title: string, message: string, metadata?: Record<string, unknown>) {
    return this.prisma.notification.create({ data: { type, title, message, metadata: metadata as any } });
  }

  async findAll(query: PaginationQueryDto & { unreadOnly?: string }) {
    const { page: _page, limit: _limit, unreadOnly } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = unreadOnly === 'true' ? { isRead: false } : {};
    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.notification.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  markAllRead() {
    return this.prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
  }

  /** Called by ProductsCleanupCron / a low-stock sweep — see spec "Low Stock" notification. */
  async checkLowStock() {
    const candidates = await this.prisma.product.findMany({
      where: { status: 'PUBLISHED', deletedAt: null },
      select: { id: true, name: true, stock: true, lowStockThreshold: true },
    });
    const lowStock = candidates.filter((p) => p.stock <= p.lowStockThreshold);
    for (const product of lowStock) {
      await this.create('LOW_STOCK', 'Low stock alert', `${product.name} has only ${product.stock} unit(s) left.`, { productId: product.id });
    }
  }
}