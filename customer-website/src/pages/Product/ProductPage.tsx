import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RiHeartFill, RiHeartLine } from 'react-icons/ri';
import SEOHead from '../../components/common/SEOHead';
import LazyImage from '../../components/common/LazyImage';
import ProductCard from '../../components/cards/ProductCard';
import OrderForm from '../../components/forms/OrderForm';
import { fetchProductBySlug, fetchProducts } from '../../services/api';
import { adaptApiProduct } from '../../services/adaptApiProduct';
import { formatPrice } from '../../utils/formatPrice';
import { useWishlist } from '../../hooks/useWishlist';
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed';

// LIVE API PAGE: fetches the product by slug from the backend, plus a page of
// products to derive "related" from (brand/category match) client-side, since
// the backend doesn't yet expose a dedicated related-products endpoint.
export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { trackView } = useRecentlyViewed();

  const { data: apiProduct, isLoading, isError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProductBySlug(slug!),
    enabled: Boolean(slug),
  });

  const { data: allProducts } = useQuery({
    queryKey: ['products', 'related-pool'],
    queryFn: () => fetchProducts({ page: 1, limit: 40 }),
  });

  const product = useMemo(() => (apiProduct ? adaptApiProduct(apiProduct) : undefined), [apiProduct]);

  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (product) {
      setVariantId(product.defaultVariantId);
      setActiveImage(0);
      trackView(product.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (isError) return <Navigate to="/shop" replace />;
  if (isLoading || !product) {
    return (
      <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-12 grid lg:grid-cols-2 gap-12">
        <div className="aspect-square rounded-2xl bg-primary/5 dark:bg-white/5 animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 rounded bg-primary/5 dark:bg-white/5 animate-pulse" />
          <div className="h-6 w-1/3 rounded bg-primary/5 dark:bg-white/5 animate-pulse" />
        </div>
      </div>
    );
  }

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const related = (allProducts?.items ?? [])
    .map(adaptApiProduct)
    .filter((p) => p.id !== product.id && (p.category === product.category || p.brand === product.brand))
    .slice(0, 4);
  const measurementStamp = `${product.lensWidth} \u25A1 ${product.bridgeWidth} - ${product.templeLength}`;

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-12">
      <SEOHead
        title={`${product.name} — ${product.brand}`}
        description={product.description.slice(0, 155)}
        image={variant.images[0]?.url}
      />

      <nav className="text-xs text-muted mb-8">
        <Link to="/shop" className="hover:text-accent">Shop</Link> / {product.name}
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <LazyImage image={variant.images[activeImage]} className="aspect-square rounded-2xl mb-4" />
          <div className="flex gap-3 overflow-x-auto pb-1">
            {variant.images.map((img, i) => (
              <button
                key={img.url + i}
                onClick={() => setActiveImage(i)}
                aria-label={`View ${img.angle} image`}
                className={`h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 ${
                  i === activeImage ? 'border-accent' : 'border-transparent'
                }`}
              >
                <LazyImage image={img} className="h-full w-full" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-muted mb-1">{product.brand}</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-primary dark:text-surface">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono text-2xl text-text dark:text-surface">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="font-mono text-muted line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              className="inline-flex items-center gap-2 rounded-full border border-primary/15 dark:border-white/15 px-4 py-2 text-sm"
            >
              {isWishlisted(product.id) ? <RiHeartFill className="text-accent" /> : <RiHeartLine />}
              Wishlist
            </button>
          </div>

          <div className="mt-6">
            <p className="text-xs font-mono uppercase text-muted mb-2">Color: {variant.color}</p>
            <div className="flex gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setVariantId(v.id);
                    setActiveImage(0);
                  }}
                  aria-label={`Select color ${v.color}`}
                  className={`h-9 w-9 rounded-full border-2 ${v.id === variant.id ? 'border-accent' : 'border-transparent'}`}
                  style={{ backgroundColor: v.colorHex }}
                />
              ))}
            </div>
          </div>

          <p className="mt-6 text-sm text-muted leading-relaxed">{product.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm border-t border-primary/10 dark:border-white/10 pt-6">
            <div><dt className="text-muted text-xs">Material</dt><dd>{product.material}</dd></div>
            <div><dt className="text-muted text-xs">Shape</dt><dd className="capitalize">{product.frameShape}</dd></div>
            <div><dt className="text-muted text-xs">Weight</dt><dd>{product.weight}g</dd></div>
            <div><dt className="text-muted text-xs">Warranty</dt><dd>{product.warranty}</dd></div>
            <div className="col-span-2">
              <dt className="text-muted text-xs">Measurements (stamped format)</dt>
              <dd className="font-mono">{measurementStamp} · Frame width {product.frameWidth}mm</dd>
            </div>
          </dl>

          <div className="mt-8 rounded-2xl border border-primary/10 dark:border-white/10 p-6">
            <h2 className="font-display text-xl mb-4 text-primary dark:text-surface">
  Order This Frame
</h2>

<OrderForm
  product={product}
  variant={variant}
/>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-primary dark:text-surface mb-6">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
