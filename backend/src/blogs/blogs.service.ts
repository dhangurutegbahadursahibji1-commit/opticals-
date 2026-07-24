import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { slugify } from '../common/utils/slugify';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService, private readonly auditLog: AuditLogService) {}

  async findAllPublic(query: PaginationQueryDto & { category?: string }) {
    const { page: _page, limit: _limit, search, category } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = {
      status: BlogStatus.PUBLISHED, deletedAt: null,
      ...(category && { category }),
      ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
    };
    const [items, total] = await Promise.all([
      this.prisma.blog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { publishedAt: 'desc' } }),
      this.prisma.blog.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findPublicBySlug(slug: string) {
    const blog = await this.prisma.blog.findFirst({ where: { slug, status: BlogStatus.PUBLISHED, deletedAt: null } });
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async findAllAdmin(query: PaginationQueryDto & { status?: BlogStatus }) {
    const { page: _page, limit: _limit, search, status } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = { deletedAt: null, ...(status && { status }), ...(search && { title: { contains: search, mode: 'insensitive' as const } }) };
    const [items, total] = await Promise.all([
      this.prisma.blog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.blog.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOne(id: string) {
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException('Blog post not found');
    return blog;
  }

  async create(dto: CreateBlogDto, authorId: string) {
    const slug = slugify(dto.title);
    const blog = await this.prisma.blog.create({
      data: { ...dto, slug, authorId, publishedAt: dto.status === BlogStatus.PUBLISHED ? new Date() : null },
    });
    await this.auditLog.record({ userId: authorId, action: 'CREATE', resource: 'blog', resourceId: blog.id });
    return blog;
  }

  async update(id: string, dto: UpdateBlogDto, actorId: string) {
    const existing = await this.findOne(id);
    const data = {
      ...dto,
      ...(dto.title && { slug: slugify(dto.title) }),
      ...(dto.status === BlogStatus.PUBLISHED && existing.status !== BlogStatus.PUBLISHED && { publishedAt: new Date() }),
    };
    const blog = await this.prisma.blog.update({ where: { id }, data });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'blog', resourceId: id });
    return blog;
  }

  async remove(id: string, actorId: string) {
    await this.findOne(id);
    await this.prisma.blog.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'blog', resourceId: id });
    return { success: true };
  }
}