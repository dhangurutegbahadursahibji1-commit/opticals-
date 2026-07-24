import type { ReactNode } from 'react';

interface GoldShimmerCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * The site's signature element: a slow, rotating conic-gradient border on hover,
 * evoking light catching the edge of a lens frame. See src/index.css (.shimmer-card).
 */
export default function GoldShimmerCard({ children, className = '' }: GoldShimmerCardProps) {
  return (
    <div className={`shimmer-card rounded-2xl bg-white dark:bg-dark-card ${className}`}>
      {children}
    </div>
  );
}
