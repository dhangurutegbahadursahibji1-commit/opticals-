import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { slugify } from '../common/utils/slugify';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogService) {}

  findAllPublic() {
    return this.prisma.category.findMany({ where: { isActive: true, deletedAt: null }, orderBy: { displayOrder: 'asc' }, include: { children: true } });
  }

  async findAllAdmin(query: PaginationQueryDto) {
    const { page: _page, limit: _limit, search } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = { deletedAt: null, ...(search && { name: { contains: search, mode: 'insensitive' as const } }) };
    const [items, total] = await Promise.all([
      this.prisma.category.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { displayOrder: 'asc' } }),
      this.prisma.category.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id }, include: { children: true, parent: true } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto, actorId: string) {
    const category = await this.prisma.category.create({ data: { ...dto, slug: slugify(dto.name) } });
    await this.auditLog.record({ userId: actorId, action: 'CREATE', resource: 'category', resourceId: category.id });
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, actorId: string) {
    await this.findOne(id);
    const data = { ...dto, ...(dto.name && { slug: slugify(dto.name) }) };
    const category = await this.prisma.category.update({ where: { id }, data });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'category', resourceId: id });
    return category;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.category.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'category', resourceId: id });
    return { success: true };
  }
}