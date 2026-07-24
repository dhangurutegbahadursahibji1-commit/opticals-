import { useEffect, useState } from 'react';
import { RiAddLine } from 'react-icons/ri';
import { api, type PaginatedData } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';

interface AdminUserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF', 'VIEWER'];

export default function UsersPage() {
  const [data, setData] = useState<PaginatedData<AdminUserRow> | null>(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'STAFF' });

  const loadUsers = () => {
    api.get('/users', { params: { page, limit: 20 } })
      .then((res) => setData(res.data.data))
      .catch(() => setError('Could not load users. (Requires Admin role.)'));
  };

  useEffect(loadUsers, [page]);

  const updateRole = async (id: string, role: string) => {
    await api.patch(`/users/${id}`, { role }).catch(() => setError('Update failed.'));
    loadUsers();
  };

  const createUser = async () => {
    try {
      await api.post('/auth/register', form);
      setModalOpen(false);
      loadUsers();
    } catch {
      setError('Could not create user.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Users</h1>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium">
          <RiAddLine /> New Staff User
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-700">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => updateRole(u.id, e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs">
                    {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">{u.isActive ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Staff User">
        <div className="space-y-3">
          {(['email', 'password', 'firstName', 'lastName'] as const).map((key) => (
            <div key={key}>
              <label className="block text-xs font-mono uppercase text-slate-500 mb-1">{key}</label>
              <input
                type={key === 'password' ? 'password' : 'text'}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
              {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <button onClick={createUser} className="w-full rounded-lg bg-primary text-white py-2.5 text-sm font-medium">Create User</button>
        </div>
      </Modal>
    </div>
  );
}
