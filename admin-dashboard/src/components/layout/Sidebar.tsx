import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  RiDashboardLine, RiShoppingBag3Line, RiPriceTag3Line, RiFolderLine, RiArticleLine,
  RiCoupon3Line, RiStarLine, RiCalendarCheckLine, RiMailLine, RiTeamLine,
  RiHistoryLine, RiSettings3Line, RiShoppingCart2Line,
  RiGitRepositoryLine, RiStethoscopeLine, RiQuestionAnswerLine, RiCloseLine,
} from 'react-icons/ri';
import { useAuth, hasMinRole } from '../../context/AuthContext';
import { useStoreBranding } from '../../hooks/useStoreBranding';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: RiDashboardLine, min: 'VIEWER' as const },
  { to: '/products', label: 'Products', icon: RiShoppingBag3Line, min: 'VIEWER' as const },
  { to: '/orders', label: 'Orders', icon: RiShoppingCart2Line, min: 'VIEWER' as const },
  { to: '/brands', label: 'Brands', icon: RiPriceTag3Line, min: 'VIEWER' as const },
  { to: '/categories', label: 'Categories', icon: RiFolderLine, min: 'VIEWER' as const },
  { to: '/blogs', label: 'Blogs', icon: RiArticleLine, min: 'VIEWER' as const },
  { to: '/offers', label: 'Offers', icon: RiCoupon3Line, min: 'VIEWER' as const },
  { to: '/testimonials', label: 'Testimonials', icon: RiStarLine, min: 'VIEWER' as const },
  { to: '/faqs', label: 'FAQs', icon: RiQuestionAnswerLine, min: 'VIEWER' as const },
  { to: '/bookings', label: 'Bookings', icon: RiCalendarCheckLine, min: 'VIEWER' as const },
  { to: '/enquiries', label: 'Enquiries', icon: RiMailLine, min: 'VIEWER' as const },
  { to: '/users', label: 'Users', icon: RiTeamLine, min: 'ADMIN' as const },
  { to: '/audit-logs', label: 'Audit Logs', icon: RiHistoryLine, min: 'ADMIN' as const },
  { to: '/optical-engine', label: 'Optical Engine', icon: RiGitRepositoryLine, min: 'ADMIN' as const },
  { to: '/consultations', label: 'Consultations', icon: RiStethoscopeLine, min: 'ADMIN' as const },
  { to: '/settings', label: 'Settings', icon: RiSettings3Line, min: 'ADMIN' as const },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { user } = useAuth();
  const branding = useStoreBranding();
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  return (
    <aside
      className={[
        // Base styles — always a fixed drawer on mobile, static column on desktop
        'fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col bg-primary text-white/80',
        'transition-transform duration-200 ease-in-out',
        // Mobile: slide in/out. Desktop: always visible, not fixed.
        open ? 'translate-x-0' : '-translate-x-full',
        'md:relative md:translate-x-0 md:z-auto',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6">
        <div>
          <p className="font-semibold text-white text-lg truncate max-w-[10rem]">
            {branding.storeName}
          </p>
          <p className="text-xs text-white/50">Admin Dashboard</p>
        </div>
        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded text-white/60 hover:text-white"
          aria-label="Close menu"
        >
          <RiCloseLine size={22} />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pb-6">
        {LINKS.filter((l) => hasMinRole(user, l.min)).map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5'
              }`
            }
          >
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}