import { Link } from 'react-router-dom';
import SEOHead from '../../components/common/SEOHead';
import { useSettings } from '../../context/SettingsContext';

export default function NotFoundPage() {
  const { storeName } = useSettings();
  return (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <SEOHead title="Page Not Found" description="This page doesn't exist." />
      <p className="font-display text-2xl text-accent mb-2">{storeName}</p>
      <h1 className="font-display text-6xl text-primary dark:text-surface mb-4">404</h1>
      <p className="text-muted mb-8">This page doesn't exist. It may have moved, or the link might be outdated.</p>
      <div className="flex justify-center gap-4">
        <Link to="/" className="rounded-full bg-primary px-6 py-3 text-white text-sm font-medium">Go Home</Link>
        <Link to="/shop" className="rounded-full border border-primary/20 dark:border-white/20 px-6 py-3 text-sm font-medium">Shop Frames</Link>
      </div>
    </div>
  );
}
