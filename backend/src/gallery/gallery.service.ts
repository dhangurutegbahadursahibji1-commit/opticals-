import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { StorageService } from '../storage/storage.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';
import { CreateAlbumDto } from './dto/create-album.dto';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly storage: StorageService
  ) {}

  findAllPublic(category?: string) {
    return this.prisma.galleryItem.findMany({
      where: { deletedAt: null, ...(category && { category }) },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findAllAdmin(query: PaginationQueryDto & { category?: string }) {
    const { page: _page, limit: _limit, category } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where = { deletedAt: null, ...(category && { category }) };
    const [items, total] = await Promise.all([
      this.prisma.galleryItem.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.galleryItem.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  createAlbum(dto: CreateAlbumDto) {
    return this.prisma.galleryAlbum.create({ data: dto });
  }

  findAlbums() {
    return this.prisma.galleryAlbum.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateGalleryItemDto, actorId: string) {
    const item = await this.prisma.galleryItem.create({ data: dto });
    await this.auditLog.record({ userId: actorId, action: 'CREATE', resource: 'gallery_item', resourceId: item.id });
    return item;
  }

  async update(id: string, dto: UpdateGalleryItemDto, actorId: string) {
    const existing = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Gallery item not found');
    const item = await this.prisma.galleryItem.update({ where: { id }, data: dto });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'gallery_item', resourceId: id });
    return item;
  }

  async remove(id: string, actorId: string) {
    const existing = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Gallery item not found');
    await this.prisma.galleryItem.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'gallery_item', resourceId: id });
    return { success: true };
  }
}