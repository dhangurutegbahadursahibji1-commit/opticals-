import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import ProductCard from '../../components/cards/ProductCard';
import ProductFilters, { type FilterState } from '../../components/filters/ProductFilters';
import { fetchProducts } from '../../services/api';
import { adaptApiProduct } from '../../services/adaptApiProduct';
import { useSettings } from '../../context/SettingsContext';

// LIVE API PAGE: this page now reads from the NestJS backend (/backend) instead
// of local JSON. Requires VITE_API_URL to point at a running, migrated, seeded
// instance of the backend — see /backend/README.md.
export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const { storeName } = useSettings();

  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get('category') ?? '',
    gender: '',
    brand: searchParams.get('brand') ?? '',
    sort: 'featured',
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', 'shop'],
    queryFn: () => fetchProducts({ page: 1, limit: 100 }),
  });

  const products = useMemo(() => (data ? data.items.map(adaptApiProduct) : []), [data]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const genders = useMemo(() => Array.from(new Set(['male', 'female', 'unisex', ...products.map((p) => p.gender)])), [products]);
  const brands = useMemo(() => Array.from(new Set(products.map((p) => p.brand))), [products]);

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) =>
        (!filters.category || p.category === filters.category) &&
        (!filters.gender || p.gender === filters.gender) &&
        (!filters.brand || p.brand === filters.brand)
    );
    if (filters.sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    if (filters.sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    if (filters.sort === 'newest') list = [...list].sort((a, b) => Number(b.isNew) - Number(a.isNew));
    return list;
  }, [products, filters]);

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-14">
      <SEOHead
        title="Shop Frames & Sunglasses"
        description={`Browse premium frames, sunglasses, computer glasses and kids eyewear at ${storeName}. Filter by brand and gender.`}
      />
      <SectionHeading eyebrow={isLoading ? 'Loading…' : `${filtered.length} Frames`} title="Shop the Collection" />

      {isError && (
        <div className="rounded-xl border border-error/30 bg-error/5 p-6 text-sm text-error mb-8">
          Could not reach the store API. Make sure the backend is running and VITE_API_URL is set correctly.
        </div>
      )}

      {!isError && (
        <div className="mb-8">
          <ProductFilters
            filters={filters}
            onChange={setFilters}
            categories={categories}
            genders={genders}
            brands={brands}
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-2xl bg-primary/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-center py-20">No frames match these filters — try widening your search.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
