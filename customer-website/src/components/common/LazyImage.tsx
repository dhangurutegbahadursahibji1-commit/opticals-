import { useEffect, useRef, useState } from 'react';
import type { ProductImage } from '../../types';

interface LazyImageProps {
  image: ProductImage;
  className?: string;
  sizes?: string;
}

/**
 * Renders an optimized <picture> with AVIF -> WebP -> original fallbacks,
 * lazy-loaded via IntersectionObserver, with an inline blur placeholder
 * shown until the real image has loaded (avoids layout shift).
 */
export default function LazyImage({ image, className = '', sizes }: LazyImageProps) {
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '150px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden bg-muted/10 ${className}`}>
      <img
        src={image.blurPlaceholder}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full object-cover scale-105 blur-md transition-opacity duration-500 ${
          loaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {inView && (
        <picture>
          <source srcSet={image.avif} type="image/avif" />
          <source srcSet={image.webp} type="image/webp" />
          <img
            src={image.url}
            alt={image.alt}
            sizes={sizes}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`relative h-full w-full object-cover transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </picture>
      )}
    </div>
  );
}
