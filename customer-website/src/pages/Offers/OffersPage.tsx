import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import GoldShimmerCard from '../../components/common/GoldShimmerCard';
import { fetchOffers } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export default function OffersPage() {
  // Previously read from a static mock JSON file, so offers created through
  // the admin Offers page (including the banner upload/discount type added
  // this session) never actually reached the storefront.
  const { data: offers = [] } = useQuery({ queryKey: ['offers'], queryFn: fetchOffers });
  const { storeName } = useSettings();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
    } catch {
      // Clipboard unavailable — code is still visible in the text above.
    }
  };

  const discountLabel = (o: { discountType: string; discountValue: string }) =>
    o.discountType === 'flat' ? `₹${o.discountValue} OFF` : `${o.discountValue}% OFF`;

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-14">
      <SEOHead title="Offers" description={`Current offers at ${storeName}: festival discounts, student pricing, senior citizen offers and combo deals.`} />
      <SectionHeading eyebrow="Save More" title="Current Offers" />
      {offers.length === 0 ? (
        <p className="text-sm text-muted">No active offers right now — check back soon.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {offers.map((o) => (
            <GoldShimmerCard key={o.id} className="overflow-hidden">
              <div
                className="aspect-[3/1] bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center bg-cover bg-center"
                style={o.bannerUrl ? { backgroundImage: `url(${o.bannerUrl})` } : undefined}
              >
                {!o.bannerUrl && <span className="font-display text-3xl text-accent-light">{discountLabel(o)}</span>}
              </div>
              <div className="p-6">
                <h2 className="font-display text-xl text-primary dark:text-surface mb-1">{o.title}</h2>
                <p className="text-sm text-muted mb-2">{o.description}</p>
                <p className="text-xs text-muted mb-4">
                  Valid until {new Date(o.validUntil).toLocaleDateString()}{o.couponCode ? ` · Code: ${o.couponCode}` : ''}
                </p>
                {o.couponCode ? (
                  <button
                    onClick={() => handleCopy(o.id, o.couponCode!)}
                    className="rounded-full bg-success px-5 py-2 text-sm font-medium text-white"
                  >
                    {copiedId === o.id ? 'Code Copied ✓' : 'Copy Code'}
                  </button>
                ) : (
                  <Link to="/shop" className="inline-block rounded-full bg-success px-5 py-2 text-sm font-medium text-white">
                    Shop Now
                  </Link>
                )}
              </div>
            </GoldShimmerCard>
          ))}
        </div>
      )}
    </div>
  );
}
