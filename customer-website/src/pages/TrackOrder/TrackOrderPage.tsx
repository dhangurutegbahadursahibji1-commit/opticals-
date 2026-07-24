import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { RiSearchLine, RiAlertLine, RiCloseCircleLine } from 'react-icons/ri';
import { trackOrder, cancelOrder, requestReturn, type OrderTrackingResponse } from '../../services/api';
import OrderTimelineTracker from '../../components/order/OrderTimelineTracker';
import SEOHead from '../../components/common/SEOHead';

export default function TrackOrderPage() {
  const [params] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get('order') ?? '');
  const [phone, setPhone] = useState('');
  const [result, setResult] = useState<OrderTrackingResponse | null>(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState('');

  const trackMutation = useMutation({
    mutationFn: () => trackOrder(orderNumber.trim(), phone.trim()),
    onSuccess: (data) => setResult(data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelOrder(id, phone.trim()),
    onSuccess: () => trackMutation.mutate(),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => requestReturn(id, phone.trim(), { reason: returnReason }),
    onSuccess: () => {
      setShowReturnForm(false);
      setReturnReason('');
      trackMutation.mutate();
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <SEOHead title="Track Your Order" description="Track your order status, cancel, or request a return." />
      <h1 className="text-3xl font-display font-semibold mb-2">Track Your Order</h1>
      <p className="text-muted mb-8">Enter your order number and the phone number used at checkout.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          trackMutation.mutate();
        }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        <input
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order Number (e.g. AO-XXXXX-XXX)"
          className="flex-1 rounded-full border border-primary/15 dark:border-white/15 bg-white dark:bg-dark-card px-5 py-3 text-sm outline-none focus:border-accent transition-colors"
          required
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone Number"
          className="flex-1 rounded-full border border-primary/15 dark:border-white/15 bg-white dark:bg-dark-card px-5 py-3 text-sm outline-none focus:border-accent transition-colors"
          required
        />
        <button
          type="submit"
          disabled={trackMutation.isPending}
          className="rounded-full bg-primary text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <RiSearchLine /> {trackMutation.isPending ? 'Searching...' : 'Track'}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {trackMutation.isError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl bg-error/10 text-error px-4 py-3 text-sm mb-6"
          >
            <RiAlertLine />
            We couldn't find an order matching that number and phone. Please double-check and try again.
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-dark-card p-6"
          >
            <div className="flex justify-between items-start mb-1">
              <div>
                <p className="font-mono text-sm text-muted">{result.orderNumber}</p>
                <h2 className="text-lg font-semibold">{result.productName}</h2>
              </div>
              <span className="text-sm font-medium text-accent">
                ₹{Number(result.totalAmount).toLocaleString('en-IN')}
              </span>
            </div>

            <OrderTimelineTracker steps={result.steps} />

            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-primary/10 dark:border-white/10">
              {result.canCancel && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this order?')) {
                      cancelMutation.mutate(result.orderNumber);
                    }
                  }}
                  disabled={cancelMutation.isPending}
                  className="rounded-full border border-error/30 text-error px-5 py-2 text-sm font-medium hover:bg-error/5 transition-colors flex items-center gap-1.5 disabled:opacity-60"
                >
                  <RiCloseCircleLine /> Cancel Order
                </button>
              )}
              {result.canReturn && !showReturnForm && (
                <button
                  onClick={() => setShowReturnForm(true)}
                  className="rounded-full border border-primary/20 px-5 py-2 text-sm font-medium hover:bg-primary/5 transition-colors"
                >
                  Request Return
                </button>
              )}
              {result.returnRequest && (
                <span className="rounded-full bg-amber-100 text-amber-800 px-4 py-2 text-xs font-medium">
                  Return {result.returnRequest.status.replace('_', ' ').toLowerCase()}
                </span>
              )}
            </div>

            <AnimatePresence>
              {showReturnForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-4"
                >
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="Tell us why you'd like to return this (min. 10 characters)"
                    rows={3}
                    className="w-full rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-dark-bg p-3 text-sm outline-none focus:border-accent transition-colors"
                  />
                  <button
                    onClick={() => returnMutation.mutate(result.orderNumber)}
                    disabled={returnReason.trim().length < 10 || returnMutation.isPending}
                    className="mt-2 rounded-full bg-primary text-white px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {returnMutation.isPending ? 'Submitting...' : 'Submit Return Request'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}