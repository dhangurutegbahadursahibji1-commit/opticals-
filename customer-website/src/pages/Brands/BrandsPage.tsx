import { useQuery } from '@tanstack/react-query';
import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import BrandCard from '../../components/cards/BrandCard';
import { fetchBrands } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import type { Brand } from '../../types';

export default function BrandsPage() {
  // Previously read from a static mock JSON file, so brands created/edited
  // through the admin Brands page (including the logo upload added this
  // session) never actually reached the storefront.
  const { data: apiBrands = [] } = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });
  const { storeName } = useSettings();

  const brands: Brand[] = apiBrands.map((b) => ({
    id: b.id,
    name: b.name,
    logo: b.logoUrl ?? '',
    story: b.description ?? '',
    collections: [], // not modeled on the backend Brand entity
  }));

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-14">
      <SEOHead title="Our Brands" description={`Shop trusted eyewear brands at ${storeName}.`} />
      <SectionHeading eyebrow="Trusted Names" title="Brands We Carry" subtitle="Every brand we stock is chosen for build quality as much as style." />
      {brands.length === 0 ? (
        <p className="text-sm text-muted">Brands will appear here once they're added in the admin panel.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-16">
            {brands.map((b) => <BrandCard key={b.id} brand={b} />)}
          </div>
          <div className="space-y-10">
            {brands.filter((b) => b.story).map((b) => (
              <div key={b.id} className="border-t border-primary/10 dark:border-white/10 pt-8 flex items-start gap-6">
                {b.logo && <img src={b.logo} alt={b.name} className="h-14 w-14 object-contain flex-shrink-0" />}
                <div>
                  <h2 className="font-display text-2xl text-primary dark:text-surface mb-2">{b.name}</h2>
                  <p className="text-muted text-sm max-w-2xl">{b.story}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
