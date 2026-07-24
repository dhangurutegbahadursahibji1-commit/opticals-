import type { Product, ProductImage, ProductVariant } from '../types';
import type { ApiProduct, ApiProductImage } from './api';

const BLUR_FALLBACK =
  'data:image/webp;base64,UklGRhwAAABXRUJQVlA4TA8AAAAvAAAAAAfQ//73v/+BiOh/AAA=';

function adaptImage(img: ApiProductImage, fallbackAlt: string): ProductImage {
  return {
    url: img.url,
    webp: img.webpUrl ?? img.url,
    avif: img.avifUrl ?? img.url,
    thumbnail: img.thumbUrl ?? img.url,
    blurPlaceholder: BLUR_FALLBACK,
    angle: (img.angle as ProductImage['angle']) ?? 'front',
    alt: img.altText ?? fallbackAlt,
  };
}

function adaptVariant(v: ApiProduct['variants'][number], productName: string): ProductVariant {
  return {
    id: v.id,
    color: v.color,
    colorHex: v.colorHex ?? '#999999',
    images: v.images.map((img) => adaptImage(img, `${productName} — ${v.color}`)),
    availability: (v.availability as ProductVariant['availability']) ?? 'in-stock',
  };
}

/**
 * Maps the live API response (Prisma-shaped, Decimal-as-string prices) onto the
 * frontend's existing `Product` type so ProductCard / ProductPage / etc. work
 * unchanged whether fed from the API or (for pages not yet converted) local JSON.
 */
export function adaptApiProduct(api: ApiProduct): Product {
  const variants =
    api.variants.length > 0
      ? api.variants.map((v) => adaptVariant(v, api.name))
      : [
          {
            id: `${api.id}-default`,
            color: 'Default',
            colorHex: '#999999',
            images: api.images.map((img) => adaptImage(img, api.name)),
            availability: 'in-stock' as const,
          },
        ];

  return {
    id: api.id,
    slug: api.slug,
    name: api.name,
    brand: api.brand?.name ?? 'Unbranded',
    price: Number(api.price),
    originalPrice: api.originalPrice ? Number(api.originalPrice) : undefined,
    variants,
    defaultVariantId: variants[0].id,
    category: (api.category?.name.toLowerCase() as Product['category']) ?? 'frames',
    gender: (api.gender as Product['gender']) ?? 'unisex',
    material: api.material ?? 'Acetate',
    frameShape: (api.frameShape as Product['frameShape']) ?? 'rectangle',
    frameWidth: api.frameWidth ?? 135,
    lensWidth: api.lensWidth ?? 52,
    bridgeWidth: api.bridgeWidth ?? 18,
    templeLength: api.templeLength ?? 145,
    weight: api.weight ?? 24,
    warranty: api.warranty ?? '1 Year Manufacturer Warranty',
    suitableFaceShapes: [],
    recommendedLens: [],
    frequentlyBoughtWith: [],
    isNew: api.isNew,
    isBestseller: api.isBestseller,
    tags: [api.category?.name ?? '', api.frameShape ?? '', api.gender ?? ''].filter(Boolean),
    description: api.description ?? '',
  };
}
