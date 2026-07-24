import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import SEOHead from '../../components/common/SEOHead';
import { fetchBlogBySlug, fetchBlogs } from '../../services/api';

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => fetchBlogBySlug(slug!),
    enabled: !!slug,
  });
  const { data: allBlogs } = useQuery({ queryKey: ['blogs'], queryFn: () => fetchBlogs({ limit: 50 }) });

  // Only redirect once we're sure the post genuinely doesn't exist — not
  // while the request is still in flight (the same "redirect on the first
  // sign of trouble" mistake that broke the lens configurator elsewhere).
  if (!isLoading && (isError || !post)) return <Navigate to="/blog" replace />;
  if (isLoading || !post) return <div className="mx-auto max-w-4xl px-6 md:px-12 py-14 text-sm text-muted">Loading…</div>;

  const related = (allBlogs?.items ?? []).filter((b) => b.id !== post.id && b.category === post.category).slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-6 md:px-12 py-14">
      <SEOHead title={post.title} description={post.excerpt ?? post.title} />
      <nav className="text-xs text-muted mb-6"><Link to="/blog" className="hover:text-accent">Blog</Link> / {post.title}</nav>
      {post.category && <p className="text-xs font-mono uppercase text-accent mb-2">{post.category.replace('-', ' ')}</p>}
      <h1 className="font-display text-3xl md:text-4xl text-primary dark:text-surface mb-2">{post.title}</h1>
      <p className="text-xs text-muted mb-8">
        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ''}{post.readTime ? ` · ${post.readTime} min read` : ''}
      </p>
      {post.featuredImage ? (
        <img src={post.featuredImage} alt={post.title} className="aspect-video w-full object-cover rounded-2xl mb-8" />
      ) : (
        <div className="aspect-video bg-primary/5 dark:bg-white/5 rounded-2xl mb-8" />
      )}
      <article className="prose prose-sm md:prose-base max-w-none prose-headings:font-display prose-headings:text-primary dark:prose-invert">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </article>

      {related.length > 0 && (
        <div className="mt-14 border-t border-primary/10 dark:border-white/10 pt-8">
          <h2 className="font-display text-xl text-primary dark:text-surface mb-4">Related Posts</h2>
          <ul className="space-y-2">
            {related.map((r) => (
              <li key={r.id}><Link to={`/blog/${r.slug}`} className="text-accent hover:underline">{r.title}</Link></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
