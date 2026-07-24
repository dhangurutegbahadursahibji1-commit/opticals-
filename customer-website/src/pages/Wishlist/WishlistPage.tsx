import { Link } from 'react-router-dom';
import SEOHead from '../../components/common/SEOHead';
import SectionHeading from '../../components/common/SectionHeading';
import ProductCard from '../../components/cards/ProductCard';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../../services/api';
import { adaptApiProduct } from '../../services/adaptApiProduct';
import { useSettings } from '../../context/SettingsContext';
import { useWishlist } from '../../hooks/useWishlist';

export default function WishlistPage() {
  const { wishlist } = useWishlist();
  const { storeName } = useSettings();

  const { data: apiProducts } = useQuery({
    queryKey: ['products', 'wishlist', wishlist],
    queryFn: () => fetchProducts({ ids: wishlist }),
    enabled: wishlist.length > 0,
  });

  const products = (apiProducts?.items || []).map(adaptApiProduct);

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-12 lg:px-24 py-14">
      <SEOHead title="Your Wishlist" description={`Frames you've saved at ${storeName}.`} />
      <SectionHeading eyebrow={`${products.length} Saved`} title="Your Wishlist" />
      {products.length === 0 ? (
        <p className="text-muted">
          Nothing saved yet. <Link to="/shop" className="text-accent hover:underline">Browse frames</Link> and tap the heart to save your favourites.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
