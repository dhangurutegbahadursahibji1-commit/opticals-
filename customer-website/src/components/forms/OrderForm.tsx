import { useNavigate } from 'react-router-dom';
import { RiListSettingsLine, RiArrowRightLine, RiShoppingBag3Line } from 'react-icons/ri';
import type { Product, ProductVariant } from '../../types';
import { useCart } from '../../context/CartContext';
import { useState } from 'react';

interface OrderFormProps {
  product: Product;
  variant: ProductVariant;
}

export default function OrderForm({ product, variant }: OrderFormProps) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const outOfStock = variant.availability === 'out-of-stock';

  if (outOfStock) {
    return (
      <div className="rounded-2xl border border-error/30 bg-error/5 p-6 text-center">
        <p className="font-medium text-error mb-2">Currently Out of Stock</p>
        <p className="text-sm text-muted">We'll notify you when this frame is back. Call us to enquire.</p>
      </div>
    );
  }

  const handleConfigureLenses = () => {
    // Navigate to configurator, we pass variant as state or defaultVariant
    navigate(`/configurator/${product.slug}`);
  };

  const handleFrameOnly = () => {
    addToCart(product, variant, 1, {
      lensConfig: {
        productId: product.id,
        variantId: variant.id,
        lensTypeId: 'frame-only',
        coatingIds: []
      },
      priceBreakdown: {
        frame: product.price,
        lens: 0,
        coating: 0,
        discount: 0,
        subtotal: product.price
      }
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      navigate('/cart');
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-surface dark:bg-dark-card border border-primary/10 dark:border-white/10 p-4">
        <div className="flex justify-between font-semibold">
          <span>Frame Price</span>
          <span>₹{product.price.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleConfigureLenses}
          className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-white px-5 py-4 text-sm font-medium hover:opacity-90 transition-opacity shadow-lg"
        >
          <RiListSettingsLine size={18} />
          Configure Lenses & Buy <RiArrowRightLine />
        </button>
        
        <button
          onClick={handleFrameOnly}
          disabled={added}
          className={`w-full flex items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-medium transition-all ${
            added ? 'border-success bg-success/10 text-success' : 'border-primary/20 hover:bg-primary/5'
          }`}
        >
          <RiShoppingBag3Line />
          {added ? 'Added to Cart' : 'Buy Frame Only'}
        </button>
      </div>
    </div>
  );
}