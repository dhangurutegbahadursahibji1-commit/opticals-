import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RiShieldCheckLine, RiUploadCloud2Line, RiCheckLine,
  RiBankLine, RiSmartphoneLine,
} from 'react-icons/ri';
import { useCart } from '../../context/CartContext';
import { useQuery } from '@tanstack/react-query';
import { placeOrder, createConsultation, uploadPublicFile, fetchConsultationPolicy } from '../../services/api';
import { useSettings } from '../../context/SettingsContext';
import type { CreateOrderPayload } from '../../types';

const schema = z.object({
  customerName: z.string().min(2, 'Enter your full name'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().min(5, 'Enter your full address'),
  fulfilment: z.enum(['store-pickup', 'home-delivery']),
  paymentMethod: z.enum(['upi', 'bank']),
  utrNumber: z.string().min(6, 'Enter UTR / transaction ID').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type CheckoutValues = z.infer<typeof schema>;

export default function CheckoutPage() {
  const { items, clearCart, totalItems } = useCart();
  const settings = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  // Set by the Cart page's "Book Consultation (₹50)" vs "Buy Now" buttons —
  // those two buttons previously both just called navigate('/checkout') with
  // nothing to tell them apart, so the choice had no actual effect.
  const paymentTier = (location.state as { paymentTier?: 'consultation' | 'full' } | null)?.paymentTier;

  const { data: consultationPolicy } = useQuery({
    queryKey: ['consultationPolicy'],
    queryFn: fetchConsultationPolicy,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const consultationFee = consultationPolicy?.consultationFee ?? 50;

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl]   = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = items.reduce((acc, item) => acc + (item.configurationSnapshot?.priceBreakdown.subtotal || (item.product.price * item.quantity)), 0);
  const [error, setError] = useState('');

  // Any item needing a lens configuration or expert help always requires
  // human review before it can be finalized — an explicit "Buy Now" click
  // doesn't skip that safety check. But an explicit "Book Consultation"
  // click DOES route a plain frame-only cart through consultation too, since
  // that's what the customer asked for.
  const needsConsultation = items.some((item) =>
    item.configurationSnapshot?.lensConfig.expertAssistance ||
    (item.configurationSnapshot?.lensConfig.lensTypeId && item.configurationSnapshot.lensConfig.lensTypeId !== 'frame-only')
  );
  const isConsultationCheckout = paymentTier === 'consultation' || needsConsultation;
  // What the customer is actually asked to pay right now via UPI/bank
  // transfer. Previously this always showed the flat consultation fee, even
  // for a plain "Buy Now" frame order — which would have under-collected the
  // real order total.
  const amountDue = isConsultationCheckout ? consultationFee : subtotal;

  const {
    register, handleSubmit, watch,
    formState: { errors },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues: { fulfilment: 'store-pickup', paymentMethod: 'upi' },
  });

  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (totalItems === 0) navigate('/cart', { replace: true });
  }, [totalItems, navigate]);

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setUploading(true);
    try {
      const url = await uploadPublicFile(file, 'payment-proof');
      setProofUrl(url);
    } catch {
      setError('Screenshot upload failed. You can still submit — paste your UTR number instead.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: CheckoutValues) => {
    setSubmitting(true);
    setError('');
    try {
      const orders = await Promise.all(
        items.map((item) => {
          const rx = item.configurationSnapshot?.lensConfig.prescription;
          const manualRx = rx?.status === 'manual' ? rx.manualData : undefined;
          const toNum = (v?: string) => (v !== undefined && v !== '' ? Number(v) : undefined);
          const payload: CreateOrderPayload = {
            customerName: values.customerName,
            phone: values.phone,
            email: values.email || undefined,
            address: values.address,
            fulfilment: values.fulfilment,

            productId:    item.product.id,
            productName:  item.product.name,
            variantColor: item.variant.color,
            quantity:     item.quantity,
            framePrice:   item.product.price,

            lensType:  item.configurationSnapshot?.lensConfig.lensTypeId || undefined,
            lensPrice: item.configurationSnapshot?.priceBreakdown.lens || 0,
            
            // Total cost of the item including frame + lens
            totalAmount: item.configurationSnapshot?.priceBreakdown.subtotal || (item.product.price * item.quantity),

            prescriptionMode: rx?.status === 'uploaded' ? 'upload' : rx?.status === 'manual' ? 'manual' : rx?.status,
            selectedPower:    rx?.status === 'plano' ? '0' : undefined,
            prescriptionUrl:  rx?.status === 'uploaded' ? item.configurationSnapshot?.lensConfig.prescriptionId : undefined,
            rightEyeSphere:   toNum(manualRx?.rightEyeSphere),
            rightEyeCylinder: toNum(manualRx?.rightEyeCylinder),
            rightEyeAxis:     toNum(manualRx?.rightEyeAxis),
            leftEyeSphere:    toNum(manualRx?.leftEyeSphere),
            leftEyeCylinder:  toNum(manualRx?.leftEyeCylinder),
            leftEyeAxis:      toNum(manualRx?.leftEyeAxis),
            pdValue:          toNum(manualRx?.pdValue),

            paymentMethod: values.paymentMethod,
            utrNumber:     values.utrNumber || undefined,
            paymentProofUrl: proofUrl || undefined,
            notes: values.notes || undefined,

            // Consultation fields
            expertAssistance: item.configurationSnapshot?.lensConfig.expertAssistance ?? (paymentTier === 'consultation'),
            customerNotes: item.configurationSnapshot?.lensConfig.customerNotes,
            
            // For mapping in backend Consultation creation
            commercialSnapshot: item,
          } as any;

          return isConsultationCheckout ? createConsultation(payload) : placeOrder(payload);
        }),
      );

      const firstOrder = orders[0];
      clearCart();
      
      navigate('/order-confirmation', {
        state: { 
          orderNumber: firstOrder?.orderNumber || firstOrder?.id || 'CONSULTATION', 
          totalAmount: amountDue 
        },
        replace: true,
      });
    } catch {
      setError('Something went wrong placing your order. Please try again or call us.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-primary/15 dark:border-white/15 bg-white dark:bg-dark-card px-3 py-2.5 text-sm outline-none focus:border-accent';
  const errorText = 'text-xs text-error mt-1';

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-display font-semibold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Customer details */}
            <section className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-dark-card p-6">
              <h2 className="font-semibold mb-4">Your Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">Full Name *</label>
                  <input {...register('customerName')} className={inputCls} placeholder="Ranjit Singh" />
                  {errors.customerName && <p className={errorText}>{errors.customerName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">Phone *</label>
                  <input {...register('phone')} className={inputCls} placeholder="9876543210" />
                  {errors.phone && <p className={errorText}>{errors.phone.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-muted mb-1">Email (optional)</label>
                  <input type="email" {...register('email')} className={inputCls} placeholder="you@example.com" />
                  {errors.email && <p className={errorText}>{errors.email.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase text-muted mb-1">Address *</label>
                  <textarea {...register('address')} rows={2} className={inputCls} placeholder="House no, Street, City, Pincode" />
                  {errors.address && <p className={errorText}>{errors.address.message}</p>}
                </div>
              </div>

              {/* Fulfilment */}
              <div className="mt-4">
                <p className="text-xs font-mono uppercase text-muted mb-2">Delivery Option</p>
                <div className="flex gap-3">
                  {([
                    { val: 'store-pickup',   label: '🏪 Store Pickup (Free)' },
                    { val: 'home-delivery',  label: '🚚 Home Delivery' },
                  ] as const).map(({ val, label }) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" {...register('fulfilment')} value={val} className="accent-accent" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-dark-card p-6">
              <h2 className="font-semibold mb-1">Payment</h2>
              <p className="text-xs text-muted mb-4">
                Pay using UPI or bank transfer, then share your UTR / screenshot below. We'll confirm your order after verifying.
              </p>

              {/* Method selector */}
              <div className="flex gap-3 mb-5">
                {([
                  { val: 'upi',  label: 'UPI',          icon: <RiSmartphoneLine /> },
                  { val: 'bank', label: 'Bank Transfer', icon: <RiBankLine /> },
                ] as const).map(({ val, label, icon }) => (
                  <label
                    key={val}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-3 cursor-pointer text-sm font-medium transition-colors ${
                      paymentMethod === val
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-primary/15 dark:border-white/10 hover:border-accent/40'
                    }`}
                  >
                    <input type="radio" {...register('paymentMethod')} value={val} className="sr-only" />
                    {icon} {label}
                  </label>
                ))}
              </div>

              {/* UPI details */}
              {paymentMethod === 'upi' && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 text-sm space-y-3">
                  <p className="font-semibold text-amber-800 dark:text-amber-200">Pay via UPI</p>
                  {!settings.paymentUpiId ? (
                    <p className="text-amber-700 dark:text-amber-300">
                      UPI payment isn't set up yet — the store owner needs to add a UPI ID in Admin → Settings.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        {settings.paymentUpiQrUrl && (
                          <img
                            src={settings.paymentUpiQrUrl}
                            alt="UPI QR code"
                            className="h-24 w-24 rounded-lg border border-amber-200 dark:border-amber-700 bg-white object-contain"
                          />
                        )}
                        <div>
                          <p className="font-mono text-lg font-bold text-amber-900 dark:text-amber-100">{settings.paymentUpiId}</p>
                          <p className="text-amber-700 dark:text-amber-300">{settings.paymentUpiName || settings.storeName}</p>
                        </div>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Open any UPI app (PhonePe, GPay, Paytm), search for the above UPI ID and pay ₹{amountDue.toLocaleString('en-IN')}{isConsultationCheckout ? ' (consultation fee)' : ''}.
                      </p>
                      {settings.paymentInstructions && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">{settings.paymentInstructions}</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Bank transfer details */}
              {paymentMethod === 'bank' && (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 text-sm space-y-2">
                  <p className="font-semibold text-blue-800 dark:text-blue-200">Bank Transfer Details</p>
                  {!settings.paymentBankName ? (
                    <p className="text-blue-700 dark:text-blue-300">
                      Bank transfer isn't set up yet — the store owner needs to add bank details in Admin → Settings.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Bank</span>
                      <span className="font-mono">{settings.paymentBankName}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Account No.</span>
                      <span className="font-mono">{settings.paymentAccountNumber}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">IFSC</span>
                      <span className="font-mono">{settings.paymentIfsc}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Name</span>
                      <span className="font-mono">{settings.paymentAccountHolder}</span>
                    </div>
                  )}
                </div>
              )}

              {/* UTR + proof */}
              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    UTR / Transaction ID *
                  </label>
                  <input
                    {...register('utrNumber')}
                    className={inputCls}
                    placeholder="12-digit UTR or transaction reference"
                  />
                  {errors.utrNumber && <p className={errorText}>{errors.utrNumber.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-muted mb-1">
                    Payment Screenshot (optional but recommended)
                  </label>
                  <label
                    htmlFor="proof-upload"
                    className={`flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-colors ${
                      proofUrl
                        ? 'border-success bg-success/5'
                        : 'border-primary/20 dark:border-white/20 hover:border-accent'
                    }`}
                  >
                    {proofUrl
                      ? <RiCheckLine className="text-success text-xl" />
                      : <RiUploadCloud2Line className="text-muted text-xl" />
                    }
                    <div>
                      <p className="text-sm font-medium">
                        {proofUrl ? (proofFile?.name ?? 'Uploaded') : 'Upload screenshot'}
                      </p>
                      <p className="text-xs text-muted">JPG, PNG or PDF</p>
                    </div>
                  </label>
                  <input
                    id="proof-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleProofUpload}
                    className="sr-only"
                    disabled={uploading}
                  />
                  {uploading && <p className="text-xs text-accent mt-1">Uploading…</p>}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-xs font-mono uppercase text-muted mb-1">Order Notes (optional)</label>
                <textarea {...register('notes')} rows={2} className={inputCls} placeholder="Any special instructions…" />
              </div>
            </section>

            {error && (
              <div className="rounded-xl bg-error/10 border border-error/30 p-4 text-sm text-error">{error}</div>
            )}
          </div>

          {/* ── Right column: order summary ── */}
          <div>
            <div className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-dark-card p-6 sticky top-24">
              <h2 className="font-semibold mb-4">Your Order</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm gap-2">
                    <div className="min-w-0">
                      <p className="truncate">{item.product.name}</p>
                      <p className="text-xs text-muted">{item.variant.color} × {item.quantity}</p>
                    </div>
                    <span className="font-medium flex-shrink-0">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-primary/10 dark:border-white/10 pt-3 flex justify-between font-semibold">
                <span>Estimated Product Total</span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-primary/10 dark:border-white/10 font-semibold text-lg">
                <span>Total to Pay Now</span>
                <span>₹{amountDue.toLocaleString('en-IN')}</span>
              </div>
              {isConsultationCheckout && amountDue < subtotal && (
                <p className="text-xs text-muted -mt-2 mb-1">
                  The remaining ₹{(subtotal - amountDue).toLocaleString('en-IN')} is collected after your prescription is verified and the order is confirmed.
                </p>
              )}

              <div className="mt-4 rounded-xl bg-surface dark:bg-dark-bg p-3 flex items-start gap-2 text-xs text-muted">
                <RiShieldCheckLine className="text-success mt-0.5 flex-shrink-0" />
                We verify every payment manually before processing your order. You'll receive a confirmation call within 2 hours.
              </div>

              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full mt-5 rounded-full bg-primary text-white py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting
                  ? (isConsultationCheckout ? 'Booking Consultation…' : 'Placing Order…')
                  : (isConsultationCheckout ? `Pay ₹${amountDue.toLocaleString('en-IN')} & Book Consultation` : `Pay ₹${amountDue.toLocaleString('en-IN')} & Place Order`)}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
