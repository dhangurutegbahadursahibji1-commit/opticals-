const COLORS: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-700',
  ACTIVE: 'bg-green-100 text-green-700',
  APPROVED: 'bg-green-100 text-green-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-100 text-green-700',
  RESOLVED: 'bg-green-100 text-green-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING: 'bg-amber-100 text-amber-700',
  NEW: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  OUT_OF_STOCK: 'bg-orange-100 text-orange-700',
  SOLD: 'bg-purple-100 text-purple-700',
  ARCHIVED: 'bg-slate-200 text-slate-600',
  DELETED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-red-100 text-red-700',
  DISABLED: 'bg-slate-200 text-slate-600',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-red-100 text-red-700',
  CLOSED: 'bg-slate-200 text-slate-600',
};

export default function Badge({ value }: { value: string }) {
  const color = COLORS[value] ?? 'bg-slate-100 text-slate-600';
  return <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium capitalize ${color}`}>{value.replace(/_/g, ' ').toLowerCase()}</span>;
}
