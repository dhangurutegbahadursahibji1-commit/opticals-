import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import GoldShimmerCard from '../../components/common/GoldShimmerCard';
import { getLenses } from '../../services/products';

export default function LensPage() {
  const lenses = getLenses();
  return (
    <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-14">
      <SEOHead title="Lens Guide" description="Understand the difference between single vision, blue-cut, progressive, photochromic, reading, computer and driving lenses." />
      <SectionHeading eyebrow="Lens Education" title="Find the Right Lens" subtitle="Not sure which lens type you need? Here's a plain-language guide." />
      <div className="grid md:grid-cols-2 gap-5">
        {lenses.map((l) => (
          <GoldShimmerCard key={l.type} className="p-6">
            <h2 className="font-display text-xl text-primary dark:text-surface mb-2">{l.name}</h2>
            <p className="text-sm text-muted mb-3">{l.description}</p>
            <p className="text-xs font-mono uppercase text-accent">Best for: {l.whoFor}</p>
          </GoldShimmerCard>
        ))}
      </div>
    </div>
  );
}
