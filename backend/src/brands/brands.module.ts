import { Module } from '@nestjs/common';
import { BrandsService } from './brands.service';
import { BrandsPublicController, BrandsAdminController } from './brands.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [BrandsService],
  controllers: [BrandsPublicController, BrandsAdminController],
  exports: [BrandsService],
})
export class BrandsModule {}
