import { Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersPublicController, OffersAdminController } from './offers.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [OffersService],
  controllers: [OffersPublicController, OffersAdminController],
  exports: [OffersService],
})
export class OffersModule {}
