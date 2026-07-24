import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import { fetchBlogs } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

export default function BlogPage() {
  // Previously read from a static mock JSON file, so posts written through
  // the admin Blogs page never actually reached the storefront.
  const { data, isLoading } = useQuery({ queryKey: ['blogs'], queryFn: () => fetchBlogs({ limit: 50 }) });
  const blogs = data?.items ?? [];
  const { storeName } = useSettings();

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-14">
      <SEOHead title="Blog" description={`Eye care tips, lens guides, frame guides and fashion advice from ${storeName}.`} />
      <SectionHeading eyebrow="Read & Learn" title="Eyewear Journal" />
      {isLoading ? (
        <p className="text-sm text-muted">Loading articles…</p>
      ) : blogs.length === 0 ? (
        <p className="text-sm text-muted">No articles published yet — check back soon.</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {blogs.map((b) => (
            <Link key={b.id} to={`/blog/${b.slug}`} className="group rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden bg-white dark:bg-dark-card">
              {b.featuredImage ? (
                <img src={b.featuredImage} alt={b.title} className="aspect-video w-full object-cover" />
              ) : (
                <div className="aspect-video bg-primary/5 dark:bg-white/5" />
              )}
              <div className="p-5">
                {b.category && <p className="text-xs font-mono uppercase text-accent mb-2">{b.category.replace('-', ' ')}</p>}
                <h2 className="font-display text-lg text-primary dark:text-surface group-hover:text-accent transition-colors mb-2">{b.title}</h2>
                <p className="text-sm text-muted line-clamp-2">{b.excerpt}</p>
                {b.readTime && <p className="text-xs text-muted mt-3">{b.readTime} min read</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
