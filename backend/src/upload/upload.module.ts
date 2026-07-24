import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [UploadController],
})
export class UploadModule {}
