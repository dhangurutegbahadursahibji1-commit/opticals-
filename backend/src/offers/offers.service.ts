import { Injectable, NotFoundException } from '@nestjs/common';
import { OfferStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogService) {}

  findAllPublic() {
    return this.prisma.offer.findMany({
      where: { status: OfferStatus.ACTIVE, deletedAt: null, validUntil: { gte: new Date() } },
      orderBy: { validUntil: 'asc' },
    });
  }

  async findAllAdmin(query: PaginationQueryDto) {
    const { page: _page, limit: _limit, search } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = { deletedAt: null, ...(search && { title: { contains: search, mode: 'insensitive' as const } }) };
    const [items, total] = await Promise.all([
      this.prisma.offer.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.offer.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const offer = await this.prisma.offer.findUnique({ where: { id } });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async create(dto: CreateOfferDto, actorId: string) {
    const offer = await this.prisma.offer.create({ data: dto });
    await this.auditLog.record({ userId: actorId, action: 'CREATE', resource: 'offer', resourceId: offer.id });
    return offer;
  }

  async update(id: string, dto: UpdateOfferDto, actorId: string) {
    await this.findOne(id);
    const offer = await this.prisma.offer.update({ where: { id }, data: dto });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'offer', resourceId: id });
    return offer;
  }

  async setStatus(id: string, status: OfferStatus, actorId: string) {
    await this.findOne(id);
    const offer = await this.prisma.offer.update({ where: { id }, data: { status } });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'offer', resourceId: id, metadata: { status } });
    return offer;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.offer.update({ where: { id }, data: { deletedAt: new Date(), status: OfferStatus.DISABLED } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'offer', resourceId: id });
    return { success: true };
  }
}