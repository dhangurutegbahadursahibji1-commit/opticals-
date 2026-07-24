import { useEffect, useState } from 'react';
import { api, type PaginatedData } from '../../api/client';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';

interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: string;
  createdAt: string;

  productName?: string;
  lensType?: string;

  prescriptionMode?: string;
  selectedPower?: string;
  prescriptionUrl?: string;
  rightEyeSphere?: string;
  rightEyeCylinder?: string;
  rightEyeAxis?: string;
  leftEyeSphere?: string;
  leftEyeCylinder?: string;
  leftEyeAxis?: string;
  pdValue?: string;
}

const STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

function PrescriptionSummary({ e }: { e: Enquiry }) {
  if (!e.prescriptionMode) return null;
  if (e.prescriptionMode === 'standard' && e.selectedPower) {
    return <p className="text-xs text-slate-600">Power: <span className="font-mono">{e.selectedPower}</span></p>;
  }
  if (e.prescriptionMode === 'upload' && e.prescriptionUrl) {
    return (
      <a href={e.prescriptionUrl} target="_blank" rel="noreferrer" className="text-xs text-accent underline">
        View uploaded prescription
      </a>
    );
  }
  if (e.prescriptionMode === 'manual') {
    return (
      <p className="text-xs text-slate-600 font-mono">
        RE: {e.rightEyeSphere || '—'} / {e.rightEyeCylinder || '—'} / {e.rightEyeAxis || '—'} &nbsp;
        LE: {e.leftEyeSphere || '—'} / {e.leftEyeCylinder || '—'} / {e.leftEyeAxis || '—'}
        {e.pdValue ? ` · PD: ${e.pdValue}` : ''}
      </p>
    );
  }
  return null;
}

export default function EnquiriesPage() {
  const [data, setData] = useState<PaginatedData<Enquiry> | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api.get('/admin/enquiries', { params: { page, limit: 20, status: statusFilter || undefined } })
      .then((res) => setData(res.data.data))
      .catch(() => setError('Could not load enquiries.'));
  };

  useEffect(load, [page, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/admin/enquiries/${id}`, { status }).catch(() => setError('Update failed.'));
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Contact Enquiries</h1>

      <select
        value={statusFilter}
        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        className="mb-4 rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
      </select>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="space-y-3">
        {data?.items.map((e) => (
          <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-slate-800">{e.name}</p>
                <p className="text-xs text-slate-400">
                  {e.phone}{e.email ? ` · ${e.email}` : ''} · {new Date(e.createdAt).toLocaleString()}
                </p>
              </div>
              <Badge value={e.status} />
            </div>

            <p className="text-sm text-slate-600 mb-3">{e.message}</p>

            {e.productName && (
              <div className="mb-3 rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1">
                <p className="text-xs font-mono uppercase text-slate-400">Product Enquiry</p>
                <p className="text-sm text-slate-700">
                  {e.productName}{e.lensType ? ` · Lens: ${e.lensType}` : ''}
                </p>
                <PrescriptionSummary e={e} />
              </div>
            )}

            <select
              value={e.status}
              onChange={(ev) => updateStatus(e.id, ev.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        ))}
        {data?.items.length === 0 && <p className="text-sm text-slate-400">No enquiries found.</p>}
      </div>

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </div>
  );
}