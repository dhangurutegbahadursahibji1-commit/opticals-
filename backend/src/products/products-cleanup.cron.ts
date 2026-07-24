import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ProductsService } from './products.service';

// Spec: "Every day at 2:00 AM — find expired records, delete Cloudflare R2 images,
// delete database records if required, write audit log, retry failed cleanup."
@Injectable()
export class ProductsCleanupCron {
  private readonly logger = new Logger(ProductsCleanupCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly auditLog: AuditLogService,
    private readonly productsService: ProductsService
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailyCleanup() {
    this.logger.log('Starting daily cleanup cron...');
    await this.purgeExpiredRecycleBinProducts();
    await this.purgeSoldProductImages();
    this.logger.log('Daily cleanup cron complete.');
  }

  private async purgeExpiredRecycleBinProducts() {
    const expired = await this.prisma.product.findMany({
      where: { status: ProductStatus.DELETED, purgeAt: { lte: new Date() } },
      select: { id: true },
    });

    for (const { id } of expired) {
      try {
        await this.productsService.purge(id);
      } catch (err) {
        this.logger.error(`Retry-worthy failure purging product ${id}: ${(err as Error).message}`);
        // Left with purgeAt in the past; next run will retry automatically.
      }
    }
    if (expired.length > 0) this.logger.log(`Purged ${expired.length} expired recycle-bin product(s).`);
  }

  private async purgeSoldProductImages() {
    const soldExpired = await this.prisma.product.findMany({
      where: { status: ProductStatus.SOLD, purgeAt: { lte: new Date() } },
      include: { images: true, variants: { include: { images: true } } },
    });

    for (const product of soldExpired) {
      try {
        const urls = [
          ...product.images.map((i) => i.url),
          ...product.variants.flatMap((v) => v.images.map((i) => i.url)),
        ];
        if (urls.length > 0) await this.storage.deleteMany(urls);
        await this.prisma.productImage.deleteMany({ where: { productId: product.id } });
        await this.prisma.product.update({ where: { id: product.id }, data: { purgeAt: null } });
        await this.auditLog.record({
          action: 'DELETE',
          resource: 'product_images',
          resourceId: product.id,
          metadata: { reason: 'sold-product-image-cleanup', count: urls.length },
        });
      } catch (err) {
        this.logger.error(`Retry-worthy failure cleaning sold product ${product.id}: ${(err as Error).message}`);
      }
    }
    if (soldExpired.length > 0) this.logger.log(`Cleaned images for ${soldExpired.length} sold product(s).`);
  }
}
