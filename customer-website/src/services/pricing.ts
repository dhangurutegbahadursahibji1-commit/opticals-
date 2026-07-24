import type { Product, LensConfiguration, PriceBreakdown } from '../types';

/**
 * A pure function to calculate the complete price breakdown for a given product and configuration.
 * Hardcoded values here represent the business rules for pricing lenses and coatings.
 * In a real backend-integrated app, these would be fetched or synced from an API.
 */
export function calculateLensPrice(product: Product, config: LensConfiguration): PriceBreakdown {
  // 1. Frame Price
  const frame = product.price;

  // 2. Lens Price
  let lens = 0;
  switch (config.lensTypeId) {
    case 'single-vision':
      lens = 1500;
      break;
    case 'progressive':
      lens = 4500;
      break;
    case 'reading':
    case 'computer':
      lens = 1200;
      break;
    case 'photochromic':
      lens = 3500;
      break;
    case 'driving':
      lens = 2500;
      break;
    case 'blue-cut':
      lens = 2000;
      break;
    case 'frame-only':
    default:
      lens = 0;
      break;
  }

  // 3. Coating Price
  let coating = 0;
  if (config.coatingIds.includes('anti-glare')) {
    coating += 500;
  }
  if (config.coatingIds.includes('blue-cut') && config.lensTypeId !== 'blue-cut') {
    coating += 800; // Only add coating price if the base lens isn't already blue-cut
  }
  if (config.coatingIds.includes('photochromic') && config.lensTypeId !== 'photochromic') {
    coating += 1500;
  }

  // 4. Promotions / Discounts (Mock rule: 10% off total if buying frame + progressive)
  let discount = 0;
  if (config.lensTypeId === 'progressive') {
    discount = (frame + lens + coating) * 0.1;
  }

  const subtotal = frame + lens + coating - discount;

  return {
    frame,
    lens,
    coating,
    discount,
    subtotal,
  };
}
