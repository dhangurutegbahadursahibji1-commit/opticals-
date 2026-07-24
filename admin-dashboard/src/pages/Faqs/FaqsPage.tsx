import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchFaqs, createFaq, updateFaq, deleteFaq, type Faq, type FaqPayload } from '../../api/client';
import toast from 'react-hot-toast';
import { RiQuestionAnswerLine, RiAddLine, RiEdit2Line, RiDeleteBin7Line, RiCloseLine, RiSave3Line } from 'react-icons/ri';

const EMPTY_FORM: FaqPayload = {
  question: '',
  answer: '',
  category: 'General',
  sortOrder: 0,
  isPublished: true,
};

export default function FaqsPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FaqPayload>(EMPTY_FORM);

  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: fetchFaqs,
  });

  // Same grouping the customer-facing FAQ page uses, so this list previews
  // categories and order exactly as visitors will see them.
  const grouped = useMemo(() => {
    const map = new Map<string, Faq[]>();
    faqs.forEach((f) => {
      const list = map.get(f.category) ?? [];
      list.push(f);
      map.set(f.category, list);
    });
    return map;
  }, [faqs]);

  const categories = useMemo(
    () => Array.from(new Set(faqs.map((f) => f.category))).sort(),
    [faqs],
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['faqs'] });

  const createMutation = useMutation({
    mutationFn: createFaq,
    onSuccess: () => {
      invalidate();
      toast.success('FAQ created');
      closeModal();
    },
    onError: () => toast.error('Could not create FAQ'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FaqPayload> }) => updateFaq(id, data),
    onSuccess: () => {
      invalidate();
      toast.success('FAQ updated');
      closeModal();
    },
    onError: () => toast.error('Could not update FAQ'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFaq,
    onSuccess: () => {
      invalidate();
      toast.success('FAQ deleted');
    },
    onError: () => toast.error('Could not delete FAQ'),
  });

  const openModal = (item?: Faq) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        question: item.question,
        answer: item.answer,
        category: item.category,
        sortOrder: item.sortOrder,
        isPublished: item.isPublished,
      });
    } else {
      setEditingId(null);
      setFormData({ ...EMPTY_FORM, sortOrder: faqs.length });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">FAQs</h1>
          <p className="text-muted text-sm mt-1">Shown on the customer FAQ page, grouped and ordered exactly as below.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2 transition-colors"
        >
          <RiAddLine size={18} />
          Add FAQ
        </button>
      </div>

      {faqs.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center bg-surface/50 border border-dashed border-border rounded-2xl">
          <RiQuestionAnswerLine size={48} className="text-muted/50 mb-3" />
          <h3 className="text-lg font-semibold text-primary mb-1">No FAQs yet</h3>
          <p className="text-sm text-muted">Add your first question — it'll appear on the storefront FAQ page right away.</p>
        </div>
      ) : (
        Array.from(grouped.entries()).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">{category}</h2>
            <div className="bg-white border border-border rounded-xl divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-primary text-sm">{item.question}</p>
                      {!item.isPublished && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">Hidden</span>
                      )}
                    </div>
                    <p className="text-sm text-muted mt-1 line-clamp-2">{item.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openModal(item)}
                      className="p-1.5 text-muted hover:text-accent hover:bg-accent/10 rounded-md transition-colors"
                    >
                      <RiEdit2Line size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete this FAQ?')) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      className="p-1.5 text-muted hover:text-error hover:bg-error/10 rounded-md transition-colors"
                    >
                      <RiDeleteBin7Line size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">{editingId ? 'Edit FAQ' : 'Add FAQ'}</h2>
              <button onClick={closeModal} className="text-muted hover:text-primary transition-colors">
                <RiCloseLine size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="faq-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Category</label>
                    <input
                      type="text"
                      list="faq-categories"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g. Returns & Exchange"
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <datalist id="faq-categories">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-1">Sort order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <p className="text-[10px] text-muted mt-1">Lower shows first within its category.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Question</label>
                  <input
                    type="text"
                    required
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="e.g. Can I return or exchange my frame?"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Answer</label>
                  <textarea
                    required
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Plain-language answer shown when the customer expands this question."
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent min-h-[100px]"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <span className="text-sm text-primary">Published (visible on the storefront FAQ page)</span>
                </label>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-border bg-surface rounded-b-2xl flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-muted hover:text-primary transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                form="faq-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <RiSave3Line size={18} />
                Save FAQ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
