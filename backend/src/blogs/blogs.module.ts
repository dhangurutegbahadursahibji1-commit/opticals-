import { Module } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { BlogsPublicController, BlogsAdminController } from './blogs.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [BlogsService],
  controllers: [BlogsPublicController, BlogsAdminController],
  exports: [BlogsService],
})
export class BlogsModule {}
