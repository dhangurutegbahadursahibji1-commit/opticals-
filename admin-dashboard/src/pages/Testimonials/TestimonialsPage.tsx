import { useEffect, useState } from 'react';
import { RiCheckLine, RiCloseLine, RiStarFill } from 'react-icons/ri';
import { api, type PaginatedData } from '../../api/client';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';

interface Testimonial {
  id: string;
  customerName: string;
  rating: number;
  review: string;
  status: string;
}

export default function TestimonialsPage() {
  const [data, setData] = useState<PaginatedData<Testimonial> | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api.get('/admin/testimonials', { params: { page, limit: 20, status: statusFilter || undefined } })
      .then((res) => setData(res.data.data))
      .catch(() => setError('Could not load testimonials.'));
  };

  useEffect(load, [page, statusFilter]);

  const moderate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await api.patch(`/admin/testimonials/${id}/status/${status}`).catch(() => setError('Update failed.'));
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Testimonials</h1>

      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        className="mb-4 rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </select>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        {data?.items.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-slate-800">{t.customerName}</p>
              <Badge value={t.status} />
            </div>
            <div className="flex text-accent mb-2">
              {Array.from({ length: t.rating }).map((_, i) => <RiStarFill key={i} size={14} />)}
            </div>
            <p className="text-sm text-slate-600 mb-4">{t.review}</p>
            {t.status === 'PENDING' && (
              <div className="flex gap-2">
                <button onClick={() => moderate(t.id, 'APPROVED')} className="flex items-center gap-1 rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-medium">
                  <RiCheckLine /> Approve
                </button>
                <button onClick={() => moderate(t.id, 'REJECTED')} className="flex items-center gap-1 rounded-lg bg-red-500 text-white px-3 py-1.5 text-xs font-medium">
                  <RiCloseLine /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
        {data?.items.length === 0 && <p className="text-sm text-slate-400">No testimonials found.</p>}
      </div>

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </div>
  );
}
