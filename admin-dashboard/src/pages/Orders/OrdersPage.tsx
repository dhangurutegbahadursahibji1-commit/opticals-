import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RiEyeLine, RiCloseLine } from 'react-icons/ri';
import { api } from '../../api/client';
import { format } from 'date-fns';

type OrderStatus    = 'NEW' | 'CONFIRMED' | 'PROCESSING' | 'READY' | 'DELIVERED' | 'CANCELLED';
type PaymentStatus  = 'PENDING' | 'RECEIVED' | 'VERIFIED' | 'FAILED' | 'REFUNDED';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  fulfilment: string;
  productName: string;
  variantColor?: string;
  quantity: number;
  lensType?: string;
  totalAmount: string;
  prescriptionMode: string;
  selectedPower?: string;
  prescriptionUrl?: string;
  rightEyeSphere?: string; rightEyeCylinder?: string; rightEyeAxis?: string;
  leftEyeSphere?: string;  leftEyeCylinder?: string;  leftEyeAxis?: string;
  pdValue?: string;
  paymentMethod: string;
  utrNumber?: string;
  paymentProofUrl?: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  expertAssistance?: boolean;
  customerNotes?: string;
  amountPaid?: number;
  amountDue?: number;
  consultationStatus?: string;
  adminNotes?: string;
  notes?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW:        'bg-blue-100 text-blue-700',
  CONFIRMED:  'bg-indigo-100 text-indigo-700',
  PROCESSING: 'bg-amber-100 text-amber-700',
  READY:      'bg-purple-100 text-purple-700',
  DELIVERED:  'bg-green-100 text-green-700',
  CANCELLED:  'bg-red-100 text-red-700',
};

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  PENDING:  'bg-amber-50 text-amber-600',
  RECEIVED: 'bg-blue-50 text-blue-600',
  VERIFIED: 'bg-green-100 text-green-700',
  FAILED:   'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
};

const ORDER_STATUSES: OrderStatus[]   = ['NEW','CONFIRMED','PROCESSING','READY','DELIVERED','CANCELLED'];
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING','RECEIVED','VERIFIED','FAILED','REFUNDED'];

async function fetchOrders(page: number, search: string, status: string, paymentStatus: string) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (search)        params.set('search', search);
  if (status)        params.set('status', status);
  if (paymentStatus) params.set('paymentStatus', paymentStatus);
  const { data } = await api.get(`/orders/admin?${params}`);
  return data.data as { items: Order[]; meta: { total: number; totalPages: number; page: number } };
}

async function updateOrder(id: string, body: Partial<{ status: OrderStatus; paymentStatus: PaymentStatus; adminNotes: string }>) {
  const { data } = await api.patch(`/orders/admin/${id}`, body);
  return data.data as Order;
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [payFilter, setPayFilter]       = useState('');
  const [selected, setSelected]         = useState<Order | null>(null);
  const [adminNotes, setAdminNotes]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter, payFilter],
    queryFn:  () => fetchOrders(page, search, statusFilter, payFilter),
  });

  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateOrder>[1] }) =>
      updateOrder(id, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      setSelected(updated);
    },
  });

  const handleStatusChange = (id: string, status: OrderStatus) =>
    mutation.mutate({ id, body: { status } });

  const handlePaymentStatusChange = (id: string, paymentStatus: PaymentStatus) =>
    mutation.mutate({ id, body: { paymentStatus } });

  const handleSaveNotes = (id: string) =>
    mutation.mutate({ id, body: { adminNotes } });

  return (
    <div className="p-6 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Orders</h1>
        <div className="flex flex-wrap gap-2">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent w-52"
            placeholder="Search name, phone, order…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
            value={payFilter}
            onChange={(e) => { setPayFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Payments</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-mono uppercase text-slate-500">
            <tr>
              {['Order #','Customer','Product','Amount','Payment','Status','Date',''].map((h) => (
                <th key={h} className="px-4 py-3 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">Loading…</td></tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">No orders found.</td></tr>
            )}
            {data?.items.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono font-semibold text-xs text-primary whitespace-nowrap">
                  {order.orderNumber}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-slate-400 text-xs">{order.phone}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="max-w-[160px] truncate">{order.productName}</p>
                  {order.variantColor && <p className="text-slate-400 text-xs">{order.variantColor}</p>}
                </td>
                <td className="px-4 py-3 font-semibold">
                  ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_COLORS[order.paymentStatus]}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {format(new Date(order.createdAt), 'dd MMM, HH:mm')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => { setSelected(order); setAdminNotes(order.adminNotes ?? ''); }}
                    className="text-slate-400 hover:text-primary transition-colors"
                    title="View details"
                  >
                    <RiEyeLine />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: data.meta.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                p === page ? 'bg-primary text-white' : 'border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── Detail drawer ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="fixed inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative ml-auto h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <p className="font-mono text-xs text-slate-400">Order</p>
                <h2 className="font-semibold text-lg text-primary">{selected.orderNumber}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700">
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer */}
              <section>
                <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">Customer</h3>
                <div className="rounded-xl border border-slate-100 p-4 space-y-1 text-sm">
                  <p><span className="text-slate-400">Name:</span> <strong>{selected.customerName}</strong></p>
                  <p><span className="text-slate-400">Phone:</span> <a href={`tel:${selected.phone}`} className="text-primary">{selected.phone}</a></p>
                  {selected.email && <p><span className="text-slate-400">Email:</span> {selected.email}</p>}
                  <p><span className="text-slate-400">Address:</span> {selected.address}</p>
                  <p><span className="text-slate-400">Fulfilment:</span> {selected.fulfilment}</p>
                </div>
              </section>

              {/* Product */}
              <section>
                <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">Product</h3>
                <div className="rounded-xl border border-slate-100 p-4 space-y-1 text-sm">
                  <p><span className="text-slate-400">Frame:</span> <strong>{selected.productName}</strong></p>
                  {selected.variantColor && <p><span className="text-slate-400">Colour:</span> {selected.variantColor}</p>}
                  <p><span className="text-slate-400">Qty:</span> {selected.quantity}</p>
                  <p><span className="text-slate-400">Total Price:</span> <strong>₹{Number(selected.totalAmount).toLocaleString('en-IN')}</strong></p>
                  
                  {selected.expertAssistance && (
                    <div className="mt-2 p-3 bg-amber-50 rounded border border-amber-200">
                      <p className="font-semibold text-amber-700">Expert Assistance Requested</p>
                      <p className="text-amber-600 text-xs mt-1">Review the prescription and customer notes before finalizing the lens configuration.</p>
                    </div>
                  )}
                  {selected.customerNotes && (
                    <div className="mt-2 p-3 bg-slate-50 rounded border border-slate-200">
                      <p className="font-semibold text-slate-700">Customer Notes</p>
                      <p className="text-slate-600 mt-1 whitespace-pre-wrap">{selected.customerNotes}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Prescription */}
              <section>
                <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">Prescription</h3>
                <div className="rounded-xl border border-slate-100 p-4 text-sm space-y-1">
                  <p><span className="text-slate-400">Mode:</span> {selected.prescriptionMode}</p>
                  {selected.selectedPower && <p><span className="text-slate-400">Selected Power:</span> <strong>{selected.selectedPower}</strong></p>}
                  {selected.prescriptionUrl && (
                    <a
                    
                      href={selected.prescriptionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline text-xs"
                    >
                      View Uploaded Prescription →
                    </a>
                  )}
                  {selected.prescriptionMode === 'manual' && (
                    <div className="mt-2 text-xs space-y-1">
                      <p><strong>RE:</strong> SPH {selected.rightEyeSphere} / CYL {selected.rightEyeCylinder} / Axis {selected.rightEyeAxis}</p>
                      <p><strong>LE:</strong> SPH {selected.leftEyeSphere} / CYL {selected.leftEyeCylinder} / Axis {selected.leftEyeAxis}</p>
                      {selected.pdValue && <p><strong>PD:</strong> {selected.pdValue} mm</p>}
                    </div>
                  )}
                </div>
              </section>

              {/* Payment */}
              <section>
                <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">Payment</h3>
                <div className="rounded-xl border border-slate-100 p-4 text-sm space-y-2">
                  <p><span className="text-slate-400">Consultation Fee Paid:</span> <strong>₹{selected.amountPaid?.toLocaleString('en-IN') || 0}</strong></p>
                  <p><span className="text-slate-400">Remaining Balance:</span> <strong className="text-accent">₹{selected.amountDue?.toLocaleString('en-IN') || selected.totalAmount}</strong></p>
                  <hr className="my-2" />
                  <p><span className="text-slate-400">Method:</span> {selected.paymentMethod.toUpperCase()}</p>
                  {selected.utrNumber && <p><span className="text-slate-400">UTR:</span> <strong className="font-mono">{selected.utrNumber}</strong></p>}
                  {selected.paymentProofUrl && (
                    <a
                      href={selected.paymentProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent underline text-xs"
                    >
                      View Payment Screenshot →
                    </a>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-slate-400">Mark payment:</span>
                    {PAYMENT_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => handlePaymentStatusChange(selected.id, s)}
                        className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                          selected.paymentStatus === s
                            ? `${PAYMENT_COLORS[s]} border-transparent`
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Order status */}
              <section>
                <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">Order Status</h3>
                <div className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selected.id, s)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                        selected.status === s
                          ? `${STATUS_COLORS[s]} border-transparent`
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </section>

              {/* Notes */}
              {selected.notes && (
                <section>
                  <h3 className="text-xs font-mono uppercase text-slate-400 mb-1">Customer Notes</h3>
                  <p className="text-sm text-slate-600 rounded-xl bg-slate-50 p-3">{selected.notes}</p>
                </section>
              )}

              <section>
                <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">Admin Notes</h3>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
                  placeholder="Internal notes…"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
                <button
                  onClick={() => handleSaveNotes(selected.id)}
                  className="mt-2 rounded-lg bg-primary text-white px-4 py-2 text-xs font-medium hover:opacity-90"
                >
                  Save Notes
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
