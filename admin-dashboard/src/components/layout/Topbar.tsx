import { RiLogoutBoxLine, RiMenuLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6 md:py-4">
      {/* Hamburger — only visible on mobile */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        aria-label="Open menu"
      >
        <RiMenuLine size={22} />
      </button>

      {/* Empty spacer on desktop (sidebar is always visible there) */}
      <div className="hidden md:block" />

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-slate-400 capitalize">
            {user?.role.replace('_', ' ').toLowerCase()}
          </p>
        </div>
        <button
          onClick={logout}
          aria-label="Log out"
          className="p-2 rounded-full hover:bg-slate-100 text-slate-500"
        >
          <RiLogoutBoxLine size={20} />
        </button>
      </div>
    </header>
  );
}