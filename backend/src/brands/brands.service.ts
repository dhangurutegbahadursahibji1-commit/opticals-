import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { slugify } from '../common/utils/slugify';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogService) {}

  findAllPublic() {
    return this.prisma.brand.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { displayOrder: 'asc' } });
  }

  async findAllAdmin(query: PaginationQueryDto) {
    const { page: _page, limit: _limit, search } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = { deletedAt: null, ...(search && { name: { contains: search, mode: 'insensitive' as const } }) };
    const [items, total] = await Promise.all([
      this.prisma.brand.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { displayOrder: 'asc' } }),
      this.prisma.brand.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async create(dto: CreateBrandDto, actorId: string) {
    const slug = slugify(dto.name);
    const brand = await this.prisma.brand.create({ data: { ...dto, slug } });
    await this.auditLog.record({ userId: actorId, action: 'CREATE', resource: 'brand', resourceId: brand.id });
    return brand;
  }

  async update(id: string, dto: UpdateBrandDto, actorId: string) {
    await this.findOne(id);
    const data = { ...dto, ...(dto.name && { slug: slugify(dto.name) }) };
    const brand = await this.prisma.brand.update({ where: { id }, data });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'brand', resourceId: id });
    return brand;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    const { deletedAt, purgeAt } = this.prisma.softDeleteData();
    await this.prisma.brand.update({ where: { id }, data: { deletedAt, purgeAt, isActive: false } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'brand', resourceId: id });
    return { success: true };
  }
}