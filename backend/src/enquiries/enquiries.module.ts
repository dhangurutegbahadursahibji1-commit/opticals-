import { Module } from '@nestjs/common';
import { EnquiriesService } from './enquiries.service';
import { EnquiriesPublicController, EnquiriesAdminController } from './enquiries.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [EnquiriesService],
  controllers: [EnquiriesPublicController, EnquiriesAdminController],
  exports: [EnquiriesService],
})
export class EnquiriesModule {}
