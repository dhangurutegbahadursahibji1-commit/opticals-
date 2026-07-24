import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CalculatePricingDto } from './dto/calculate-pricing.dto';
import { Public } from '../common/decorators/public.decorator';

// IMPORTANT: do NOT hardcode 'api/v1/...' here. main.ts already applies a
// global prefix ('api') + URI versioning ('v1') to every controller in the
// app. Writing it again here used to double it up into
// /api/v1/api/v1/pricing/calculate — a path the frontend's baseURL
// (.../api/v1/pricing/calculate) could never reach, which is why every price
// calculation in the lens configurator 404'd.
@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  // Public: customers configuring lenses on the storefront are not logged in.
  @Public()
  @Post('calculate')
  calculatePricing(@Body() dto: CalculatePricingDto) {
    return this.pricingService.calculatePricing(dto);
  }
}
