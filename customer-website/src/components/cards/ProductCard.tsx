import { Link } from 'react-router-dom';
import { RiHeartFill, RiHeartLine } from 'react-icons/ri';
import type { Product } from '../../types';
import LazyImage from '../common/LazyImage';
import GoldShimmerCard from '../common/GoldShimmerCard';
import { formatPrice } from '../../utils/formatPrice';
import { useWishlist } from '../../hooks/useWishlist';

export default function ProductCard({ product }: { product: Product }) {
  const defaultVariant =
    product.variants.find((v) => v.id === product.defaultVariantId) ?? product.variants[0];
  const { isWishlisted, toggleWishlist } = useWishlist();
  const outOfStock = defaultVariant.availability === 'out-of-stock';

  return (
    <GoldShimmerCard className="group overflow-hidden">
      <Link to={`/shop/${product.slug}`} className="block">
        <div className="relative">
          <LazyImage image={defaultVariant.images[0]} className="aspect-[4/5] rounded-t-2xl" />
          {product.isNew && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-mono uppercase tracking-wide text-white">
              New
            </span>
          )}
          {product.isBestseller && !product.isNew && (
            <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 text-[10px] font-mono uppercase tracking-wide text-white">
              Bestseller
            </span>
          )}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button
              aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product.id);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-dark-card/90 text-primary dark:text-surface shadow"
            >
              {isWishlisted(product.id) ? <RiHeartFill className="text-accent" /> : <RiHeartLine />}
            </button>
          </div>
        </div>

        <div className="p-4">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">{product.brand}</p>
          <h3 className="font-display text-lg font-semibold text-primary dark:text-surface leading-snug">
            {product.name}
          </h3>
          <div className="mt-2 flex items-center gap-2 font-mono text-sm">
            <span className="text-text dark:text-surface">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-muted line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
          {outOfStock ? (
            <span className="mt-3 inline-block text-xs font-medium text-error">Notify Me — Out of Stock</span>
          ) : (
            <span className="mt-3 inline-block text-xs font-medium text-success capitalize">
              {defaultVariant.availability.replace('-', ' ')}
            </span>
          )}
        </div>
      </Link>
    </GoldShimmerCard>
  );
}
