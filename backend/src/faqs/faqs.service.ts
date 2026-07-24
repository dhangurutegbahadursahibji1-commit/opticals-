import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // Public: published only, pre-sorted. The customer FAQ page groups by
  // `category` in the order categories first appear in this array, and
  // renders items within a category in this array's order — so ordering
  // here IS the ordering the admin set via sortOrder, nothing further to sort client-side.
  findAllPublic() {
    return this.prisma.faq.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findAllAdmin(query: PaginationQueryDto & { category?: string }) {
    const { page: _page, limit: _limit, category } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 50;
    const where = { deletedAt: null, ...(category && { category }) };
    const [items, total] = await Promise.all([
      this.prisma.faq.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.faq.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const f = await this.prisma.faq.findUnique({ where: { id } });
    if (!f) throw new NotFoundException('FAQ not found');
    return f;
  }

  async create(dto: CreateFaqDto, actorId: string) {
    const f = await this.prisma.faq.create({ data: dto });
    await this.auditLog.record({ userId: actorId, action: 'CREATE', resource: 'faq', resourceId: f.id });
    return f;
  }

  async update(id: string, dto: UpdateFaqDto, actorId: string) {
    await this.findOne(id);
    const f = await this.prisma.faq.update({ where: { id }, data: dto });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'faq', resourceId: id });
    return f;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.faq.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'faq', resourceId: id });
    return { success: true };
  }
}
