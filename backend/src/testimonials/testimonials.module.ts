import { Module } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { TestimonialsPublicController, TestimonialsAdminController } from './testimonials.controller';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AuditLogModule],
  providers: [TestimonialsService],
  controllers: [TestimonialsPublicController, TestimonialsAdminController],
  exports: [TestimonialsService],
})
export class TestimonialsModule {}
