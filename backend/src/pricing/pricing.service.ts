import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConsultationPolicyService } from '../consultation-policy/consultation-policy.service';
import { CalculatePricingDto } from './dto/calculate-pricing.dto';

@Injectable()
export class PricingService {
  constructor(
    private prisma: PrismaService,
    private consultationPolicy: ConsultationPolicyService,
  ) {}

  async calculatePricing(dto: CalculatePricingDto) {
    let framePrice = 0;
    let lensPrice = 0;
    let addOnsPrice = 0;
    let discount = 0;
    let tax = 0;

    // Consultation fee now comes from one place (admin-editable Settings via
    // ConsultationPolicyService) instead of being hardcoded separately here
    // and in consultation-policy.service.ts, which could drift out of sync.
    const policy = await this.consultationPolicy.getPolicy();
    const consultationFee = policy.consultationFee;

    // 1. Frame Pricing
    if (dto.productId) {
      const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
      if (!product) throw new BadRequestException('Product not found');
      framePrice = Number(product.price);
    }

    // 2. Lens Pricing
    if (dto.lensTypeId) {
      const lens = await this.prisma.opticalLensType.findUnique({
        where: { id: dto.lensTypeId }
      });
      if (!lens) throw new BadRequestException('Lens type not found');
      if (!lens.isActive) throw new BadRequestException('Lens type is inactive');

      // Variant <-> lens compatibility. VariantLensCompatibility is an
      // allow-list table. Enforcing it unconditionally would break every
      // lens until an admin manually lists every compatible variant, so we
      // only enforce it once at least one rule exists for this lens type
      // (i.e. an admin has actually started curating compatibility for it).
      // Until then, the lens is treated as compatible with everything, which
      // matches the previous (unenforced) behaviour.
      if (dto.variantId) {
        const rulesForLens = await this.prisma.variantLensCompatibility.count({
          where: { lensTypeId: dto.lensTypeId },
        });
        if (rulesForLens > 0) {
          const compatible = await this.prisma.variantLensCompatibility.findUnique({
            where: { variantId_lensTypeId: { variantId: dto.variantId, lensTypeId: dto.lensTypeId } },
          });
          if (!compatible) {
            throw new BadRequestException('This lens type is not available for the selected frame.');
          }
        }
      }

      lensPrice = Number(lens.salePrice || lens.basePrice);
      tax += (lensPrice * Number(lens.taxRate)) / 100;
    }

    // 3. Add-Ons Pricing
    const addOnsDetails: { id: string; name: string; price: number }[] = [];
    if (dto.addOnIds && dto.addOnIds.length > 0) {
      for (const addOnId of dto.addOnIds) {
        const addOn = await this.prisma.opticalAddOn.findUnique({ where: { id: addOnId } });
        if (!addOn) throw new BadRequestException(`AddOn ${addOnId} not found`);
        if (!addOn.isActive) throw new BadRequestException(`AddOn ${addOn.name} is inactive`);

        // Same opt-in-strict pattern as above for lens <-> add-on compatibility.
        if (dto.lensTypeId) {
          const rulesForLens = await this.prisma.lensAddOnCompatibility.count({
            where: { lensTypeId: dto.lensTypeId },
          });
          if (rulesForLens > 0) {
            const compatible = await this.prisma.lensAddOnCompatibility.findUnique({
              where: { lensTypeId_addOnId: { lensTypeId: dto.lensTypeId, addOnId } },
            });
            if (!compatible) {
              throw new BadRequestException(`${addOn.name} is not available with the selected lens type.`);
            }
          }
        }

        const price = Number(addOn.salePrice || addOn.basePrice);
        addOnsPrice += price;
        tax += (price * Number(addOn.taxRate)) / 100;

        addOnsDetails.push({
          id: addOn.id,
          name: addOn.name,
          price
        });
      }
    }

    const subtotal = framePrice + lensPrice + addOnsPrice;
    const total = subtotal - discount + tax + consultationFee;

    return {
      framePrice,
      lensPrice,
      addOnPrice: addOnsPrice,
      addOns: addOnsDetails,
      consultationFee,
      discount,
      tax,
      total,
      // Alias: the configurator frontend (ConfiguratorContext -> priceBreakdown)
      // reads `subtotal` as the grand total to display. The response only ever
      // had `total`, so the on-screen "Estimated Total" was always ₹0 (Number(undefined) || 0).
      subtotal: total,
      currency: 'INR'
    };
  }
}
