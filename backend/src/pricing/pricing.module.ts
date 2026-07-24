import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { ConsultationPolicyModule } from '../consultation-policy/consultation-policy.module';

@Module({
  imports: [ConsultationPolicyModule],
  controllers: [PricingController],
  providers: [PricingService],
  exports: [PricingService]
})
export class PricingModule {}
