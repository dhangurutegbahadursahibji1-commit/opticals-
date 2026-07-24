import { Link, useNavigate } from 'react-router-dom';
import { RiDeleteBin6Line, RiArrowLeftLine, RiShoppingCartLine, RiErrorWarningLine } from 'react-icons/ri';
import { useQuery } from '@tanstack/react-query';
import { useCart } from '../../context/CartContext';
import LazyImage from '../../components/common/LazyImage';
import { fetchProducts } from '../../services/api';

export default function CartPage() {
  const { items, totalItems, subtotal, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  // Cart items are a snapshot taken at "add to cart" time, so if an admin
  // changes a price or a product sells out afterwards, a returning customer
  // would previously never find out until a human noticed at fulfilment time.
  // Re-check against the live catalogue whenever the cart is viewed.
  const productIds = items.map((i) => i.product.id);
  const { data: liveProducts } = useQuery({
    queryKey: ['products', 'cart-check', productIds],
    queryFn: () => fetchProducts({ ids: productIds }),
    enabled: productIds.length > 0,
  });
  const liveById = new Map((liveProducts?.items ?? []).map((p) => [p.id, p]));
  const staleItems = items.filter((item) => {
    const live = liveById.get(item.product.id);
    return live && Number(live.price) !== item.product.price;
  });
  const outOfStockItems = items.filter((item) => {
    const live = liveById.get(item.product.id);
    return live && live.stock <= 0;
  });
  const canCheckout = outOfStockItems.length === 0;

  if (totalItems === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <RiShoppingCartLine className="text-5xl text-muted" />
        <h1 className="text-2xl font-display font-semibold">Your cart is empty</h1>
        <p className="text-muted text-center">Browse our collection and add frames you love.</p>
        <Link
          to="/shop"
          className="rounded-full bg-primary text-white px-8 py-3 text-sm font-medium hover:opacity-90"
        >
          Shop Frames
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="text-muted hover:text-primary transition-colors">
          <RiArrowLeftLine className="text-xl" />
        </button>
        <h1 className="text-2xl font-display font-semibold">
          Your Cart <span className="text-muted font-normal text-base">({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
        </h1>
      </div>

      {(staleItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-sm p-4 flex gap-2">
          <RiErrorWarningLine className="flex-shrink-0 mt-0.5" />
          <div>
            {outOfStockItems.length > 0 && (
              <p className="font-medium">{outOfStockItems.map((i) => i.product.name).join(', ')} {outOfStockItems.length === 1 ? 'is' : 'are'} now out of stock. Please remove {outOfStockItems.length === 1 ? 'it' : 'them'} to continue.</p>
            )}
            {staleItems.length > 0 && (
              <p>The price of {staleItems.map((i) => i.product.name).join(', ')} has changed since you added {staleItems.length === 1 ? 'it' : 'them'} to your cart. The current price will be used at checkout.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const primaryImage = item.variant.images[0];
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-dark-card p-4 flex gap-4"
              >
                <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-surface dark:bg-dark-bg">
                  {primaryImage && (
                    <LazyImage
                      image={primaryImage}
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-medium text-sm leading-tight">{item.product.name}</p>
                      <p className="text-xs text-muted">{item.product.brand} · {item.variant.color}</p>
                      {item.configurationSnapshot?.lensConfig.lensTypeId && item.configurationSnapshot.lensConfig.lensTypeId !== 'frame-only' && (
                        <p className="text-xs text-accent mt-0.5">+ {item.configurationSnapshot.lensConfig.lensTypeId} lens</p>
                      )}
                      {item.configurationSnapshot?.lensConfig.prescription?.status && (
                        <p className="text-xs text-muted mt-0.5">
                          Prescription:{' '}
                          {item.configurationSnapshot.lensConfig.prescription.status === 'uploaded' && 'Uploaded slip'}
                          {item.configurationSnapshot.lensConfig.prescription.status === 'enter_later' && 'Provide later'}
                          {item.configurationSnapshot.lensConfig.prescription.status === 'pending' && 'Pending check'}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-error hover:opacity-70 transition-opacity flex-shrink-0"
                      aria-label="Remove"
                    >
                      <RiDeleteBin6Line />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-primary/15 dark:border-white/10 rounded-full">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-lg disabled:opacity-30"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-lg"
                      >
                        +
                      </button>
                    </div>
                    <p className="font-semibold text-sm">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-dark-card p-6 sticky top-24">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery</span>
                <span className="text-success">Free</span>
              </div>
            </div>
            <div className="border-t border-primary/10 dark:border-white/10 mt-4 pt-4 flex justify-between font-semibold text-lg">
              <span>Estimated Total</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-xs text-muted mt-2">
              Final price will be confirmed after optical consultation. A ₹50 consultation fee is required to proceed.
            </p>
            <div className="mt-5 space-y-3">
              <button
                onClick={() => navigate('/checkout', { state: { paymentTier: 'consultation' } })}
                disabled={!canCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-accent text-white py-3.5 text-sm font-semibold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Book Consultation (₹50)
              </button>
              <button
                onClick={() => navigate('/checkout', { state: { paymentTier: 'full' } })}
                disabled={!canCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-full border border-primary/20 text-primary dark:border-white/20 dark:text-white py-3.5 text-sm font-semibold hover:bg-primary/5 dark:hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>
            <Link
              to="/shop"
              className="block text-center text-xs text-muted mt-3 hover:text-primary transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}