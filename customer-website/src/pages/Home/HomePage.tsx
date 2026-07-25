import { useRef, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RiShieldCheckLine, RiEyeLine, RiMapPin2Line } from 'react-icons/ri';
import ScrollTrigger from 'gsap/ScrollTrigger';
import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import ProductCard from '../../components/cards/ProductCard';
import BrandCard from '../../components/cards/BrandCard';
import CallButton from '../../components/buttons/CallButton';
import { fetchProducts, fetchBrands, fetchOffers } from '../../services/api';
import { adaptApiProduct } from '../../services/adaptApiProduct';
import { useSettings } from '../../context/SettingsContext';
import { createHeroNarrativeTimeline } from '../../animations/timelines/hero';
import { useMotionPreferences } from '../../providers/MotionPreferences';

export default function HomePage() {
  const { data: bestsellerData } = useQuery({
    queryKey: ['products', 'bestsellers'],
    queryFn: () => fetchProducts({ isBestseller: true, limit: 8 }),
  });
  const bestsellers = (bestsellerData?.items ?? []).map(adaptApiProduct);

  const { data: apiBrands } = useQuery({ queryKey: ['brands'], queryFn: fetchBrands });
  const brands = (apiBrands ?? []).slice(0, 6).map((b) => ({ id: b.id, name: b.name, logo: b.logoUrl ?? '', story: b.description ?? '', collections: [] as string[] }));

  const { data: apiOffers } = useQuery({ queryKey: ['offers'], queryFn: fetchOffers });
  const offers = (apiOffers ?? []).slice(0, 3).map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description ?? '',
    discount: o.discountType === 'flat' ? `₹${o.discountValue} OFF` : `${o.discountValue}% OFF`,
  }));

  const settings = useSettings();
  const heroRef = useRef<HTMLDivElement>(null);
  const { motionTier } = useMotionPreferences();

  // useLayoutEffect runs cleanup BEFORE React removes DOM nodes.
  // useEffect runs cleanup AFTER — by then GSAP's pinned elements are gone
  // from their original parent, causing removeChild to throw.
  useLayoutEffect(() => {
    if (motionTier === 'none' || motionTier === undefined) return;
    const ctx = createHeroNarrativeTimeline(heroRef);
    return () => {
      ctx?.revert();
      // Kill all ScrollTriggers scoped to this page so none linger after unmount
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, [motionTier]);

  // Render the same hero DOM structure regardless of motionTier so React
  // never has to swap between two completely different trees while GSAP
  // may have already pinned/moved nodes from the first one.
  const isReducedMotion = motionTier === 'none';

  return (
    <>
      <SEOHead
        title="Premium Eyewear Showroom"
        description={`Shop premium frames, sunglasses and computer glasses. Free eye tests.${settings.address ? ` ${settings.address}` : ''}`}
      />

      {/* Narrative GSAP Hero */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden bg-transparent">
        {isReducedMotion ? (
          <div className="text-center px-6 mt-20">
            <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[1.05] text-primary">
              See the world, <span className="text-accent italic">in focus.</span>
            </h1>
            <p className="mt-6 text-muted text-lg">Premium frames, honest eye tests, and a flawless fitting experience.</p>
          </div>
        ) : (
          <div className="relative w-full max-w-7xl mx-auto px-6 h-full flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="story-frame font-display text-6xl md:text-8xl lg:text-9xl font-bold text-primary tracking-tighter opacity-100">
                FRAME.
              </h1>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="story-lens font-display text-6xl md:text-8xl lg:text-9xl font-bold text-accent italic opacity-0">
                LENS.
              </h1>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="story-light font-display text-6xl md:text-8xl lg:text-9xl font-bold text-primary drop-shadow-lg opacity-0">
                LIGHT.
              </h1>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <h1 className="story-vision font-display text-6xl md:text-8xl lg:text-9xl font-bold text-primary opacity-0">
                VISION.
              </h1>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center story-collection opacity-0 pointer-events-auto">
              <h1 className="font-display text-5xl md:text-7xl font-semibold text-primary mb-6">
                The Collection
              </h1>
              <Link
                to="/shop"
                className="rounded-full bg-accent px-8 py-3.5 font-medium text-primary transition-transform hover:scale-105 shadow-deep"
              >
                Shop Frames
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Trust strip */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-10 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-surface">
        {[
          { icon: RiShieldCheckLine, title: '1-Year Warranty', desc: 'On every frame we sell' },
          { icon: RiEyeLine, title: 'Free Eye Test', desc: 'No purchase required' },
          { icon: RiMapPin2Line, title: 'Visit In Store', desc: settings.address || 'Find your nearest store' },
        ].map((item) => (
          <div key={item.title} className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-white/40 backdrop-blur-md p-5 shadow-soft hover:shadow-deep transition-shadow">
            <item.icon className="text-accent shrink-0" size={28} />
            <div>
              <p className="font-semibold text-primary">{item.title}</p>
              <p className="text-sm text-muted">{item.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Bestsellers */}
      <section className="relative z-10 bg-surface mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-16">
        <SectionHeading eyebrow="Fan Favourites" title="Bestselling Frames" subtitle="The pairs our customers keep coming back for." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/shop" className="text-accent font-medium hover:underline transition-colors duration-fast">
            View all frames →
          </Link>
        </div>
      </section>

      {/* Brands */}
      <section className="relative z-10 bg-surface mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-16">
        <SectionHeading eyebrow="Trusted Names" title="Shop by Brand" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {brands.map((b) => (
            <BrandCard key={b.id} brand={b} />
          ))}
        </div>
      </section>

      {/* Offers */}
      <section className="relative z-10 bg-primary text-surface py-16">
        <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24">
          <SectionHeading eyebrow="Save More" title="Current Offers" />
          <div className="grid md:grid-cols-3 gap-5">
            {offers.map((o) => (
              <div key={o.id} className="rounded-2xl border border-white/15 p-6 hover:border-accent transition-colors duration-fast">
                <span className="font-mono text-accent-light text-sm tracking-widest uppercase">{o.discount}</span>
                <h3 className="font-display text-xl mt-2 mb-2 text-white">{o.title}</h3>
                <p className="text-sm text-surface/70">{o.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 bg-surface mx-auto max-w-5xl px-6 py-24 text-center">
        <h2 className="font-display text-4xl md:text-5xl text-primary mb-6">
          Ready to find your perfect pair?
        </h2>
        <p className="text-muted mb-10 text-lg">Book a free eye test or send us a quick enquiry.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/contact" className="rounded-full bg-accent px-10 py-4 font-medium text-primary transition-transform hover:scale-105 shadow-deep">
            Send Enquiry
          </Link>
          <CallButton />
        </div>
      </section>
    </>
  );
}