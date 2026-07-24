import type { ReactNode } from 'react';
import { RiCloseLine } from 'react-icons/ri';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg text-slate-800">{title}</h2>
          <button onClick={onClose} aria-label="Close"><RiCloseLine size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
