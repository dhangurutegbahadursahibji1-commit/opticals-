import { Module } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { FaqsPublicController, FaqsAdminController } from './faqs.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [FaqsService],
  controllers: [FaqsPublicController, FaqsAdminController],
  exports: [FaqsService],
})
export class FaqsModule {}
