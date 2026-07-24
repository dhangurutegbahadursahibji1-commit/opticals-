interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40">Prev</button>
      <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 disabled:opacity-40">Next</button>
    </div>
  );
}
