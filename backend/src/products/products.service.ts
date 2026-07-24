import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { StorageService } from '../storage/storage.service';
import { PaginationQueryDto, paginate } from '../common/dto/pagination.dto';
import { slugify } from '../common/utils/slugify';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

const RECYCLE_BIN_DAYS = 7;
const PRODUCT_INCLUDE = {
  brand: true,
  category: true,
  variants: { include: { images: true } },
  images: { where: { variantId: null } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly storage: StorageService
  ) {}

  // ---------------------------------------------------------------
  // Customer-facing reads: published, non-deleted only.
  // ---------------------------------------------------------------
  async findPublished(query: QueryProductDto) {
    const { page: _page, limit: _limit, search, brandId, categoryId, gender, frameShape, sortBy, sortOrder, isFeatured, isNew, isBestseller, ids } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where: Prisma.ProductWhereInput = {
      status: ProductStatus.PUBLISHED,
      deletedAt: null,
      ...(brandId && { brandId }),
      ...(categoryId && { categoryId }),
      ...(gender && { gender }),
      ...(frameShape && { frameShape }),
      ...(isFeatured !== undefined && { isFeatured: isFeatured === 'true' }),
      ...(isNew !== undefined && { isNew: isNew === 'true' }),
      ...(isBestseller !== undefined && { isBestseller: isBestseller === 'true' }),
      ...(ids && ids.length > 0 && { id: { in: ids } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // When fetching a specific id set (wishlist/cart), there's no natural
    // page size — return all of them rather than silently truncating at the
    // default/requested limit.
    const effectiveLimit = ids && ids.length > 0 ? Math.max(limit, ids.length) : limit;

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        skip: (page - 1) * effectiveLimit,
        take: effectiveLimit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(items, total, page, effectiveLimit);
  }

  async findPublishedBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: ProductStatus.PUBLISHED, deletedAt: null },
      include: PRODUCT_INCLUDE,
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ---------------------------------------------------------------
  // Admin reads: everything, including drafts/archived (never deleted unless asked).
  // ---------------------------------------------------------------
  async findAllAdmin(query: QueryProductDto) {
    const { page: _page, limit: _limit, search, status, brandId, categoryId, sortBy, sortOrder } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(brandId && { brandId }),
      ...(categoryId && { categoryId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: PRODUCT_INCLUDE,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  async findOneAdmin(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async recycleBin(query: PaginationQueryDto) {
    const { page: _page, limit: _limit } = query;
    const page = Number(_page) || 1;
    const limit = Number(_limit) || 20;
    const where: Prisma.ProductWhereInput = { deletedAt: { not: null } };
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where, include: PRODUCT_INCLUDE, skip: (page - 1) * limit, take: limit, orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return paginate(items, total, page, limit);
  }

  // ---------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------
  async create(dto: CreateProductDto, actorId: string) {
    const slug = await this.uniqueSlug(dto.name);
    const { variants, ...rest } = dto;

    // Step 1: product + variants without images (ProductImage.productId cannot be
    // inferred inside a nested create — must be set explicitly)
    const product = await this.prisma.product.create({
      data: {
        ...rest,
        slug,
        status: (rest.status as any) || ProductStatus.DRAFT,
        variants: variants
          ? { create: variants.map((v) => ({ color: v.color, colorHex: v.colorHex, stock: v.stock ?? 0, availability: v.availability ?? 'in-stock', videoUrl: v.videoUrl })) }
          : undefined,
      },
      include: PRODUCT_INCLUDE,
    });

    // Step 2: images now that product.id is known
    if (variants) {
      for (let i = 0; i < product.variants.length; i++) {
        const variantDto = variants[i];
        const variant = product.variants[i];
        if (variantDto?.images?.length) {
          await this.prisma.productImage.createMany({
            data: variantDto.images.map((img, idx) => ({ ...img, displayOrder: idx, productId: product.id, variantId: variant.id })),
          });
        }
      }
    }

    const result = await this.prisma.product.findUnique({ where: { id: product.id }, include: PRODUCT_INCLUDE });
    await this.auditLog.record({ userId: actorId, action: 'CREATE', resource: 'product', resourceId: product.id });
    return result;
  }

  async update(id: string, dto: UpdateProductDto, actorId: string) {
    await this.findOneAdmin(id);
    const { variants, ...rest } = dto;
    const data: Prisma.ProductUpdateInput = { ...rest };
    if (dto.name) data.slug = await this.uniqueSlug(dto.name, id);

    await this.prisma.product.update({ where: { id }, data });

    // If the admin form submitted a variants array (it always does — the
    // simple product form manages one implicit "Default" variant), replace
    // the product's existing variants/images/video with the submitted set.
    // This was previously a silent no-op: `variants` was destructured out of
    // the DTO and never used, so uploading new photos while editing a
    // product succeeded (the file really did reach R2) but was never
    // attached to the product, and there was no way to remove a photo,
    // reorder them, change the primary image, or attach a video at all.
    if (variants) {
      await this.prisma.$transaction(async (tx) => {
        // Cascades delete the variants' ProductImage rows too (onDelete: Cascade).
        await tx.productVariant.deleteMany({ where: { productId: id } });
        for (const v of variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: id,
              color: v.color,
              colorHex: v.colorHex,
              stock: v.stock ?? 0,
              availability: v.availability ?? 'in-stock',
              videoUrl: v.videoUrl,
            },
          });
          if (v.images?.length) {
            await tx.productImage.createMany({
              data: v.images.map((img, idx) => ({ ...img, displayOrder: idx, productId: id, variantId: variant.id })),
            });
          }
        }
      });
    }

    const product = await this.prisma.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'product', resourceId: id });
    return product;
  }

  async publish(id: string, actorId: string) {
    await this.findOneAdmin(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.PUBLISHED, publishedAt: new Date() },
    });
    await this.auditLog.record({ userId: actorId, action: 'PUBLISH', resource: 'product', resourceId: id });
    return product;
  }

  async unpublish(id: string, actorId: string) {
    await this.findOneAdmin(id);
    const product = await this.prisma.product.update({ where: { id }, data: { status: ProductStatus.DRAFT } });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'product', resourceId: id, metadata: { unpublished: true } });
    return product;
  }

  async markSold(id: string, actorId: string) {
    await this.findOneAdmin(id);
    // Spec: mark Sold -> remove from public catalogue, keep DB record + R2 images
    // for 7 days, then the daily cron purges the images automatically.
    const product = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.SOLD, soldAt: new Date(), purgeAt: new Date(Date.now() + RECYCLE_BIN_DAYS * 86_400_000) },
    });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'product', resourceId: id, metadata: { markedSold: true } });
    return product;
  }

  async archive(id: string, actorId: string) {
    await this.findOneAdmin(id);
    const product = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.ARCHIVED, archivedAt: new Date() },
    });
    await this.auditLog.record({ userId: actorId, action: 'ARCHIVE', resource: 'product', resourceId: id });
    return product;
  }

  /** Soft delete -> recycle bin for 7 days, hidden from customers immediately. */
  async softDelete(id: string, actorId: string) {
    await this.findOneAdmin(id);
    const { deletedAt, purgeAt } = this.prisma.softDeleteData(RECYCLE_BIN_DAYS);
    const product = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.DELETED, deletedAt, purgeAt },
    });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'product', resourceId: id });
    return product;
  }

  async restore(id: string, actorId: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || !product.deletedAt) throw new NotFoundException('Product not found in recycle bin');

    const restored = await this.prisma.product.update({
      where: { id },
      data: { status: ProductStatus.DRAFT, deletedAt: null, purgeAt: null },
    });
    await this.auditLog.record({ userId: actorId, action: 'RESTORE', resource: 'product', resourceId: id });
    return restored;
  }

  /** Permanently removes the record + its R2 images. Used by admin "empty bin" and the cron job. */
  async purge(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: { include: { images: true } } },
    });
    if (!product) return;

    const urls = [
      ...product.images.map((i) => i.url),
      ...product.variants.flatMap((v) => v.images.map((i) => i.url)),
    ];
    if (urls.length > 0) {
      await this.storage.deleteMany(urls).catch(() => undefined);
    }
    await this.prisma.product.delete({ where: { id } });
    await this.auditLog.record({ action: 'DELETE', resource: 'product', resourceId: id, metadata: { permanent: true } });
  }

  async duplicate(id: string, actorId: string) {
    const original = await this.findOneAdmin(id);
    const slug = await this.uniqueSlug(`${original.name} copy`);

    const copy = await this.prisma.product.create({
      data: {
        name: `${original.name} (Copy)`,
        slug,
        description: original.description,
        price: original.price,
        originalPrice: original.originalPrice,
        status: ProductStatus.DRAFT,
        stock: original.stock,
        lowStockThreshold: original.lowStockThreshold,
        gender: original.gender,
        material: original.material,
        frameShape: original.frameShape,
        frameWidth: original.frameWidth,
        lensWidth: original.lensWidth,
        bridgeWidth: original.bridgeWidth,
        templeLength: original.templeLength,
        weight: original.weight,
        warranty: original.warranty,
        brandId: original.brandId,
        categoryId: original.categoryId,
        // images omitted here — ProductImage.productId must be set explicitly
        variants: {
          create: original.variants.map((v) => ({
            color: v.color,
            colorHex: v.colorHex,
            stock: v.stock,
            availability: v.availability,
          })),
        },
      },
      include: PRODUCT_INCLUDE,
    });

    // Re-create images now that copy.id is available
    for (const origVariant of original.variants) {
      const newVariant = copy.variants.find((nv) => nv.color === origVariant.color);
      if (newVariant && origVariant.images.length) {
        await this.prisma.productImage.createMany({
          data: origVariant.images.map((img) => ({
            url: img.url, webpUrl: img.webpUrl, avifUrl: img.avifUrl, thumbUrl: img.thumbUrl,
            angle: img.angle, altText: img.altText, isPrimary: img.isPrimary, displayOrder: img.displayOrder,
            productId: copy.id,
            variantId: newVariant.id,
          })),
        });
      }
    }

    const result = await this.prisma.product.findUnique({ where: { id: copy.id }, include: PRODUCT_INCLUDE });
    await this.auditLog.record({ userId: actorId, action: 'CREATE', resource: 'product', resourceId: copy.id, metadata: { duplicatedFrom: id } });
    return result;
  }

  // ---------------------------------------------------------------
  // Bulk operations
  // ---------------------------------------------------------------
  async bulkPublish(ids: string[], actorId: string) {
    await this.prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: ProductStatus.PUBLISHED, publishedAt: new Date() } });
    await this.auditLog.record({ userId: actorId, action: 'PUBLISH', resource: 'product', metadata: { bulk: true, ids } });
    return { updated: ids.length };
  }

  async bulkArchive(ids: string[], actorId: string) {
    await this.prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: ProductStatus.ARCHIVED, archivedAt: new Date() } });
    await this.auditLog.record({ userId: actorId, action: 'ARCHIVE', resource: 'product', metadata: { bulk: true, ids } });
    return { updated: ids.length };
  }

  async bulkDelete(ids: string[], actorId: string) {
    const { deletedAt, purgeAt } = this.prisma.softDeleteData(RECYCLE_BIN_DAYS);
    await this.prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: ProductStatus.DELETED, deletedAt, purgeAt } });
    await this.auditLog.record({ userId: actorId, action: 'DELETE', resource: 'product', metadata: { bulk: true, ids } });
    return { updated: ids.length };
  }

  async bulkRestore(ids: string[], actorId: string) {
    await this.prisma.product.updateMany({ where: { id: { in: ids } }, data: { status: ProductStatus.DRAFT, deletedAt: null, purgeAt: null } });
    await this.auditLog.record({ userId: actorId, action: 'RESTORE', resource: 'product', metadata: { bulk: true, ids } });
    return { updated: ids.length };
  }

  async bulkUpdate(ids: string[], dto: UpdateProductDto, actorId: string) {
    const { variants: _variants, ...rest } = dto;
    await this.prisma.product.updateMany({ where: { id: { in: ids } }, data: rest });
    await this.auditLog.record({ userId: actorId, action: 'UPDATE', resource: 'product', metadata: { bulk: true, ids } });
    return { updated: ids.length };
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------
  private async uniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name);
    if (!base) throw new BadRequestException('Could not derive a slug from the product name.');

    let slug = base;
    let suffix = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.product.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${base}-${++suffix}`;
    }
  }
}