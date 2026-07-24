import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesPublicController, CategoriesAdminController } from './categories.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [CategoriesService],
  controllers: [CategoriesPublicController, CategoriesAdminController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
