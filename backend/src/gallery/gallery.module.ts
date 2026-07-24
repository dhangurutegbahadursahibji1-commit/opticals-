import { Module } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { GalleryPublicController, GalleryAdminController } from './gallery.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [GalleryService],
  controllers: [GalleryPublicController, GalleryAdminController],
  exports: [GalleryService],
})
export class GalleryModule {}
