import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsPublicController, SettingsAdminController } from './settings.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [SettingsService],
  controllers: [SettingsPublicController, SettingsAdminController],
  exports: [SettingsService],
})
export class SettingsModule {}
