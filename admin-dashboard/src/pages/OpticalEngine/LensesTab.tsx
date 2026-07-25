import { useEffect, useState } from 'react';
import { RiAddLine, RiDeleteBinLine, RiEdit2Line } from 'react-icons/ri';
import { api } from '../../api/client';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';

interface LensType {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  salePrice?: number | null;
  isActive: boolean;
  material: string;
}

const emptyForm = { name: '', description: '', basePrice: 0, salePrice: '', isActive: true, material: '' };

export default function LensesTab() {
  const [lenses, setLenses] = useState<LensType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    api.get('/admin/lenses')
      .then((res: any) => {
        // Backend wraps response in { success, data: [...] } — unwrap it
        const items = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setLenses(items);
      })
      .catch(() => setError('Could not load lenses.'));
  };

  useEffect(load, []);

  const closeDialog = () => {
    setModalOpen(false);
    setForm(emptyForm);
  };

  const handleEdit = (lens: LensType) => {
    setForm({
      ...lens,
      salePrice: lens.salePrice ?? '',
    });
    setModalOpen(true);
  };

  const remove = async (id: string) => {
    if (!confirm('Archive this lens type?')) return;
    await api.delete(`/admin/lenses/${id}`).catch(() => setError('Delete failed.'));
    load();
  };

  const save = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        basePrice: Number(form.basePrice),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        isActive: form.isActive,
        material: form.material
      };

      if (form.id) {
        await api.put(`/admin/lenses/${form.id}`, payload);
      } else {
        await api.post('/admin/lenses', payload);
      }
      closeDialog();
      load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving lens type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Lens Catalogue</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium"
        >
          <RiAddLine /> New Lens
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[500px] text-sm text-left">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Base Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {lenses.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-700">{l.name}</td>
                <td className="px-4 py-3 text-slate-500">{l.material || 'Standard'}</td>
                <td className="px-4 py-3">₹{l.basePrice}</td>
                <td className="px-4 py-3">
                  <Badge value={l.isActive ? 'PUBLISHED' : 'DRAFT'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <button title="Edit" onClick={() => handleEdit(l)}><RiEdit2Line /></button>
                    <button title="Archive" onClick={() => remove(l.id)}><RiDeleteBinLine className="text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {lenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No lenses configured yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={closeDialog} title={form.id ? "Edit Lens Type" : "New Lens Type"}>
        <div className="space-y-4">
          <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <Field label="Material" value={form.material} onChange={(v) => setForm({ ...form, material: v })} />
          
          <div className="grid grid-cols-2 gap-4">
            <Field label="Base Price (₹)" type="number" value={String(form.basePrice)} onChange={(v) => setForm({ ...form, basePrice: v })} />
            <Field label="Sale Price (₹)" type="number" value={String(form.salePrice)} onChange={(v) => setForm({ ...form, salePrice: v })} />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 mt-2">
            <input 
              type="checkbox" 
              checked={form.isActive} 
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })} 
              className="rounded border-slate-300 text-primary focus:ring-primary"
            />
            Active (Visible on Frontend)
          </label>

          <button
            onClick={save}
            disabled={loading || !form.name}
            className="w-full rounded-lg bg-primary text-white py-2.5 text-sm font-medium disabled:opacity-50 mt-6"
          >
            {loading ? 'Saving...' : form.id ? 'Update Lens' : 'Create Lens'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase text-slate-500 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}