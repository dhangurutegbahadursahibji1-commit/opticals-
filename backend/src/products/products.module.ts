import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsPublicController, ProductsAdminController } from './products.controller';
import { ProductsCleanupCron } from './products-cleanup.cron';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [ProductsService, ProductsCleanupCron],
  controllers: [ProductsPublicController, ProductsAdminController],
  exports: [ProductsService],
})
export class ProductsModule {}
