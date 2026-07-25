import { useEffect, useState } from 'react';
import { RiDownloadLine } from 'react-icons/ri';
import { api, type PaginatedData } from '../../api/client';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';

interface Booking {
  id: string;
  customerName: string;
  phone: string;
  date: string;
  time: string;
  concern?: string;
  status: string;
  notes?: string;
}

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];

export default function BookingsPage() {
  const [data, setData] = useState<PaginatedData<Booking> | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api.get('/admin/bookings', { params: { page, limit: 20, status: statusFilter || undefined } })
      .then((res) => setData(res.data.data))
      .catch(() => setError('Could not load bookings.'));
  };

  useEffect(load, [page, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/admin/bookings/${id}`, { status }).catch(() => setError('Update failed.'));
    load();
  };

  const exportCsv = () => {
    api.get('/admin/bookings/export', { params: { status: statusFilter || undefined }, responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'eye-test-bookings.csv';
        a.click();
      })
      .catch(() => setError('Export failed.'));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800">Eye Test Bookings</h1>
        <button onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium">
          <RiDownloadLine /> Export CSV
        </button>
      </div>

      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        className="mb-4 rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
      </select>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Update</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((b) => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-700">{b.customerName}</td>
                <td className="px-4 py-3 text-slate-500">{b.phone}</td>
                <td className="px-4 py-3">{new Date(b.date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{b.time}</td>
                <td className="px-4 py-3"><Badge value={b.status} /></td>
                <td className="px-4 py-3">
                  <select
                    value={b.status}
                    onChange={(e) => updateStatus(b.id, e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No bookings found.</p>}
      </div>

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </div>
  );
}