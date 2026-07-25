import { useEffect, useState } from 'react';
import { RiShoppingBag3Line, RiCheckboxCircleLine, RiAlertLine, RiCalendarCheckLine, RiMailLine, RiPriceTag3Line } from 'react-icons/ri';
import { api } from '../../api/client';
import StatCard from '../../components/ui/StatCard';

interface DashboardStats {
  products: { total: number; published: number; sold: number; lowStock: number };
  today: { bookings: number; enquiries: number };
  latestEnquiries: { id: string; name: string; message: string; createdAt: string }[];
  latestBookings: { id: string; customerName: string; date: string; time: string }[];
  popularProducts: { id: string; name: string; price: number }[];
  revenue: { placeholder: boolean; message: string };
}

// Retries the given async function up to `retries` times with a delay between
// attempts. Needed because Render free tier cold-starts take 50–90 s — the
// first request often times out before the server is ready.
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 4,
  delayMs = 8000,
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('unreachable');
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // First attempt — if it fails, show "waking up" message and keep retrying
        const res = await api.get('/admin/dashboard/stats').catch(async (err) => {
          if (cancelled) throw err;
          setWaking(true);         // show the banner after the first failure
          // fetchWithRetry will do the remaining 3 attempts (8 s apart)
          return fetchWithRetry(() => api.get('/admin/dashboard/stats'), 3, 8000);
        });
        if (!cancelled) {
          setWaking(false);
          setStats(res.data.data);
        }
      } catch {
        if (!cancelled) {
          setWaking(false);
          setError('Could not load dashboard stats. Is the API running and reachable?');
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-500">
        <svg className="animate-spin h-6 w-6 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-sm">
          {waking
            ? 'Server is waking up on Render free tier — this takes up to 60 s…'
            : 'Loading dashboard…'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Products" value={stats.products.total} icon={RiShoppingBag3Line} />
        <StatCard label="Published" value={stats.products.published} icon={RiCheckboxCircleLine} />
        <StatCard label="Low Stock" value={stats.products.lowStock} icon={RiAlertLine} />
        <StatCard label="Sold" value={stats.products.sold} icon={RiPriceTag3Line} />
        <StatCard label="Today's Bookings" value={stats.today.bookings} icon={RiCalendarCheckLine} />
        <StatCard label="Today's Enquiries" value={stats.today.enquiries} icon={RiMailLine} />
      </div>

      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 mb-8 text-sm text-slate-500">
        {stats.revenue.message}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Latest Enquiries</h2>
          <ul className="space-y-3">
            {stats.latestEnquiries.map((e) => (
              <li key={e.id} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                <p className="font-medium text-slate-700">{e.name}</p>
                <p className="text-slate-500 line-clamp-1">{e.message}</p>
              </li>
            ))}
            {stats.latestEnquiries.length === 0 && <p className="text-sm text-slate-400">No enquiries yet.</p>}
          </ul>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Latest Bookings</h2>
          <ul className="space-y-3">
            {stats.latestBookings.map((b) => (
              <li key={b.id} className="text-sm border-b border-slate-100 pb-2 last:border-0 flex justify-between">
                <span className="font-medium text-slate-700">{b.customerName}</span>
                <span className="text-slate-500">{new Date(b.date).toLocaleDateString()} {b.time}</span>
              </li>
            ))}
            {stats.latestBookings.length === 0 && <p className="text-sm text-slate-400">No bookings yet.</p>}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 p-5 mt-6">
        <h2 className="font-semibold text-slate-800 mb-3">Popular Products</h2>
        <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {stats.popularProducts.map((p) => (
            <li key={p.id} className="rounded-lg border border-slate-100 p-3 text-sm">
              <p className="font-medium text-slate-700">{p.name}</p>
              <p className="text-slate-500">₹{p.price}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}