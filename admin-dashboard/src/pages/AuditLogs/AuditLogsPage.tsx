import { useEffect, useState } from 'react';
import { api, type PaginatedData } from '../../api/client';
import Pagination from '../../components/ui/Pagination';

interface AuditLogRow {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
}

export default function AuditLogsPage() {
  const [data, setData] = useState<PaginatedData<AuditLogRow> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/audit-logs', { params: { page, limit: 30 } })
      .then((res) => setData(res.data.data))
      .catch(() => setError('Could not load audit logs. (Requires Admin role.)'));
  }, [page]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Audit Logs</h1>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{log.action}</td>
                <td className="px-4 py-3 text-slate-500">{log.resource}{log.resourceId ? ` #${log.resourceId.slice(0, 8)}` : ''}</td>
                <td className="px-4 py-3 text-slate-400">{log.ipAddress ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No activity recorded yet.</p>}
      </div>

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
    </div>
  );
}
