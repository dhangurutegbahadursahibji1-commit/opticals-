import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Video from 'yet-another-react-lightbox/plugins/video';
import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import { fetchGallery } from '../../services/api';

const CATEGORIES = ['All', 'store', 'events', 'before-after'] as const;

export default function GalleryPage() {
  // Previously read from a static mock JSON file — so anything an admin
  // added through the (also previously missing) Gallery admin page could
  // never actually show up here. Now live.
  const { data: gallery = [], isLoading } = useQuery({
    queryKey: ['gallery'],
    queryFn: () => fetchGallery(),
  });
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('All');
  const [index, setIndex] = useState(-1);

  const filtered = category === 'All' ? gallery : gallery.filter((g) => g.category === category);

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-14">
      <SEOHead title="Gallery" description="Photos and videos from our showroom, our frame collection, happy customers, and store events." />
      <SectionHeading eyebrow="A Look Inside" title="Gallery" />

      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm border capitalize ${
              category === c ? 'bg-primary text-white border-primary' : 'border-primary/15 dark:border-white/15 text-text dark:text-surface'
            }`}
          >
            {c === 'before-after' ? 'Before & After' : c}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading gallery…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">No photos here yet — check back soon.</p>
      ) : (
        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {filtered.map((g, i) => (
            <button
              key={g.id}
              onClick={() => setIndex(i)}
              className="block w-full rounded-xl overflow-hidden break-inside-avoid bg-primary/5 dark:bg-white/5 relative"
              aria-label={`Open ${g.altText ?? 'gallery item'}`}
            >
              {g.type === 'video' ? (
                <video src={g.url} className="w-full h-auto" muted playsInline />
              ) : (
                <img src={g.url} alt={g.altText ?? ''} className="w-full h-auto" loading="lazy" />
              )}
            </button>
          ))}
        </div>
      )}

      <Lightbox
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
        plugins={[Video]}
        slides={filtered.map((g) =>
          g.type === 'video'
            ? { type: 'video' as const, sources: [{ src: g.url, type: 'video/mp4' }] }
            : { src: g.url, alt: g.altText }
        )}
      />
    </div>
  );
}
