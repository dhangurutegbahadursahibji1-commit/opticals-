import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConsultationController } from './consultation.controller';
import { ConsultationService } from './consultation.service';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [PrismaModule, PricingModule],
  controllers: [ConsultationController],
  providers: [ConsultationService]
})
export class ConsultationModule {}
