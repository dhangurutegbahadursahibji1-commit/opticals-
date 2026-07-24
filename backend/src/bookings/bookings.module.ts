import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsPublicController, BookingsAdminController } from './bookings.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [BookingsService],
  controllers: [BookingsPublicController, BookingsAdminController],
  exports: [BookingsService],
})
export class BookingsModule {}
