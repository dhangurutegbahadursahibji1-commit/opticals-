import { useLocation, Link } from 'react-router-dom';
import { RiCheckboxCircleFill, RiPhoneLine } from 'react-icons/ri';

interface LocationState {
  orderNumber: string;
  totalAmount: number;
}

export default function OrderConfirmationPage() {
  const { state } = useLocation() as { state: LocationState | null };

  if (!state?.orderNumber) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted">No order found.</p>
        <Link to="/" className="text-accent underline">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <RiCheckboxCircleFill className="text-success text-6xl mx-auto mb-4" />
        <h1 className="text-3xl font-display font-semibold mb-2">Order Placed!</h1>
        <p className="text-muted mb-6">
          Your order <strong className="text-primary dark:text-surface font-mono">{state.orderNumber}</strong> has been received.
          We'll verify your payment and call you within 2 hours to confirm.
        </p>

        <div className="rounded-2xl bg-surface dark:bg-dark-card border border-primary/10 dark:border-white/10 p-5 text-sm text-left space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-muted">Order Number</span>
            <span className="font-mono font-semibold">{state.orderNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Amount Paid</span>
            <span className="font-semibold">₹{state.totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Status</span>
            <span className="text-amber-600 font-medium">Awaiting Verification</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted mb-8">
          <RiPhoneLine className="text-primary" />
          Need help? Call us at{' '}
          <a href="tel:+919463295273" className="text-primary font-medium">+91 94632 95273</a>
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            to="/shop"
            className="rounded-full border border-primary/20 px-6 py-2.5 text-sm font-medium hover:bg-primary/5 transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            to={`/track-order?order=${state.orderNumber}`}
            className="rounded-full border border-accent/30 text-accent px-6 py-2.5 text-sm font-medium hover:bg-accent/5 transition-colors"
          >
            Track Order
          </Link>
          <Link
            to="/"
            className="rounded-full bg-primary text-white px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
