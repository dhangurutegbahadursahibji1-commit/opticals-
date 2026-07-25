import { useEffect, useState } from 'react';
import { RiAddLine, RiDeleteBinLine, RiEditLine } from 'react-icons/ri';
import { api, type PaginatedData } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import ImageUploadField from '../common/ImageUploadField';

export interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'textarea' | 'url' | 'image' | 'date' | 'select';
  /** R2 folder to upload into, when type === 'image'. */
  folder?: string;
  /** Options, when type === 'select'. */
  options?: { value: string; label: string }[];
}

interface SimpleCrudPageProps<T extends { id: string }> {
  title: string;
  adminBasePath: string; // e.g. /admin/brands
  columns: { key: keyof T; label: string; render?: (item: T) => React.ReactNode }[];
  formFields: FieldConfig[];
  emptyForm: Record<string, string | number>;
}

export default function SimpleCrudPage<T extends { id: string }>({
  title, adminBasePath, columns, formFields, emptyForm,
}: SimpleCrudPageProps<T>) {
  const [data, setData] = useState<PaginatedData<T> | null>(null);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api.get(adminBasePath, { params: { page, limit: 20 } })
      .then((res) => setData(res.data.data))
      .catch(() => setError(`Could not load ${title.toLowerCase()}.`));
  };

  useEffect(load, [page]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (item: T) => {
    setEditingId(item.id);
    const next: Record<string, string | number> = {};
    formFields.forEach((f) => { next[f.key] = (item as any)[f.key] ?? ''; });
    setForm(next);
    setModalOpen(true);
  };

  const save = async () => {
    try {
      if (editingId) await api.patch(`${adminBasePath}/${editingId}`, form);
      else await api.post(adminBasePath, form);
      setModalOpen(false);
      load();
    } catch {
      setError('Save failed — check required fields.');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await api.delete(`${adminBasePath}/${id}`).catch(() => setError('Delete failed.'));
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800">{title}</h1>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium">
          <RiAddLine /> New
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              {columns.map((c) => <th key={String(c.key)} className="px-4 py-3">{c.label}</th>)}
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                {columns.map((c) => (
                  <td key={String(c.key)} className="px-4 py-3 text-slate-700">
                    {c.render ? c.render(item) : (() => {
                      const val = (item as any)[c.key];
                      if (!val || typeof val !== 'object') return String(val ?? '—');
                      return JSON.stringify(val);
                    })()}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-slate-500 whitespace-nowrap">
                    <button title="Edit" onClick={() => openEdit(item)}><RiEditLine /></button>
                    <button title="Delete" onClick={() => remove(item.id)}><RiDeleteBinLine className="text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.items.length === 0 && <p className="text-center text-sm text-slate-400 py-8">Nothing here yet.</p>}
      </div>

      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? `Edit ${title}` : `New ${title}`}>
        <div className="space-y-3">
          {formFields.map((f) => (
            <div key={f.key}>
              {f.type === 'image' ? (
                <ImageUploadField
                  label={f.label}
                  value={String(form[f.key] ?? '')}
                  onChange={(url) => setForm({ ...form, [f.key]: url })}
                  folder={f.folder}
                />
              ) : (
                <>
                  <label className="block text-xs font-mono uppercase text-slate-500 mb-1">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  ) : f.type === 'select' ? (
                    <select
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
                    >
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : f.type === 'date' ? (
                    <input
                      type="date"
                      value={form[f.key] ? String(form[f.key]).slice(0, 10) : ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={form[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                  )}
                </>
              )}
            </div>
          ))}
          <button onClick={save} className="w-full rounded-lg bg-primary text-white py-2.5 text-sm font-medium">
            {editingId ? 'Save Changes' : 'Create'}
          </button>
        </div>
      </Modal>
    </div>
  );
}