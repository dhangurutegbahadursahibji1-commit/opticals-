import { RiLogoutBoxLine } from 'react-icons/ri';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-slate-800">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-slate-400 capitalize">{user?.role.replace('_', ' ').toLowerCase()}</p>
        </div>
        <button onClick={logout} aria-label="Log out" className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
          <RiLogoutBoxLine size={20} />
        </button>
      </div>
    </header>
  );
}
