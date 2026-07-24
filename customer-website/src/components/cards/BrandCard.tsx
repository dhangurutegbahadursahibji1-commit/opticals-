import { Link } from 'react-router-dom';
import type { Brand } from '../../types';

export default function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link
      to={`/shop?brand=${encodeURIComponent(brand.name)}`}
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-dark-card p-8 text-center transition-transform hover:-translate-y-1"
    >
      <span className="font-display text-2xl text-primary dark:text-surface group-hover:text-accent transition-colors">
        {brand.name}
      </span>
      {brand.collections.length > 0 && (
        <span className="text-xs text-muted line-clamp-2">{brand.collections.join(' · ')}</span>
      )}
    </Link>
  );
}
