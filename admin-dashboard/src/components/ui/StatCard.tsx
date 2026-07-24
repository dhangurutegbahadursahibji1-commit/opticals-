import type { IconType } from 'react-icons';

export default function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: IconType }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
