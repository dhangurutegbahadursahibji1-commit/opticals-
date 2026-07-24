import { NavLink } from 'react-router-dom';
import {
  RiDashboardLine, RiShoppingBag3Line, RiPriceTag3Line, RiFolderLine, RiArticleLine,
  RiCoupon3Line, RiStarLine, RiCalendarCheckLine, RiMailLine, RiTeamLine,
  RiHistoryLine, RiSettings3Line, RiShoppingCart2Line, RiImageLine,
  RiGitRepositoryLine, RiStethoscopeLine, RiQuestionAnswerLine
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
  { to: '/gallery', label: 'Gallery', icon: RiImageLine, min: 'VIEWER' as const },
  { to: '/faqs', label: 'FAQs', icon: RiQuestionAnswerLine, min: 'VIEWER' as const },

  { to: '/bookings', label: 'Bookings', icon: RiCalendarCheckLine, min: 'VIEWER' as const },
  { to: '/enquiries', label: 'Enquiries', icon: RiMailLine, min: 'VIEWER' as const },
  { to: '/users', label: 'Users', icon: RiTeamLine, min: 'ADMIN' as const },
  { to: '/audit-logs', label: 'Audit Logs', icon: RiHistoryLine, min: 'ADMIN' as const },
  { to: '/optical-engine', label: 'Optical Engine', icon: RiGitRepositoryLine, min: 'ADMIN' as const },
  { to: '/consultations', label: 'Consultations', icon: RiStethoscopeLine, min: 'ADMIN' as const },
  { to: '/settings', label: 'Settings', icon: RiSettings3Line, min: 'ADMIN' as const },
];

export default function Sidebar() {
  const { user } = useAuth();
  const branding = useStoreBranding();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-primary text-white/80 min-h-screen">
      <div className="px-6 py-6">
        <p className="font-semibold text-white text-lg truncate max-w-[13rem]">{branding.storeName}</p>
        <p className="text-xs text-white/50">Admin Dashboard</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
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
