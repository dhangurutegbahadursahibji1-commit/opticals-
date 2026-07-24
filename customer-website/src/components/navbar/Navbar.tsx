import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RiSearchLine, RiHeartLine, RiContrastLine, RiMenuLine } from 'react-icons/ri';
import { useWishlist } from '../../hooks/useWishlist';
import { useSearch } from '../../hooks/useSearch';
import { fetchProducts } from '../../services/api';
import { adaptApiProduct } from '../../services/adaptApiProduct';
import { useSettings } from '../../context/SettingsContext';
import MobileDrawer from './MobileDrawer';

const NAV_LINKS = [
  { to: '/shop', label: 'Shop' },
  { to: '/brands', label: 'Brands' },
  { to: '/lenses', label: 'Lenses' },
  { to: '/eye-test', label: 'Eye Test' },
  { to: '/offers', label: 'Offers' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { wishlist } = useWishlist();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { data: searchPool } = useQuery({
    queryKey: ['products', 'search-pool'],
    queryFn: () => fetchProducts({ limit: 100 }),
    staleTime: 1000 * 60 * 5,
  });
  const { query, setQuery, results } = useSearch((searchPool?.items ?? []).map(adaptApiProduct));
  const navigate = useNavigate();
  const { storeName, logoUrl } = useSettings();
  const [brandFirstWord, ...brandRest] = (storeName || 'Your Store').split(' ');

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface/90 dark:bg-dark-bg/90 backdrop-blur border-b border-primary/10 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-12 lg:px-24 py-4">
        <NavLink to="/" className="flex items-center gap-2 font-display text-2xl font-semibold text-primary dark:text-surface">
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="h-9 w-auto object-contain" />
          ) : (
            <>
              {brandFirstWord}
              {brandRest.length > 0 && <> <span className="text-accent">{brandRest.join(' ')}</span></>}
            </>
          )}
        </NavLink>

        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-accent ${
                  isActive ? 'text-accent' : 'text-text dark:text-surface/80'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 md:gap-3">
          <div className="relative hidden sm:block">
            <button
              aria-label="Search products"
              onClick={() => setSearchOpen((o) => !o)}
              className="p-2 rounded-full hover:bg-primary/5 dark:hover:bg-white/5 text-text dark:text-surface"
            >
              <RiSearchLine size={20} />
            </button>
            {searchOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white dark:bg-dark-card shadow-xl p-3">
                <input
                  autoFocus
                  id="global-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search frames, brands..."
                  className="w-full rounded-lg border border-primary/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-accent"
                />
                {results.length > 0 && (
                  <ul className="mt-2 max-h-64 overflow-auto">
                    {results.slice(0, 6).map((p) => (
                      <li key={p.id}>
                        <button
                          onClick={() => {
                            navigate(`/shop/${p.slug}`);
                            setSearchOpen(false);
                            setQuery('');
                          }}
                          className="block w-full text-left px-2 py-2 text-sm rounded hover:bg-primary/5 dark:hover:bg-white/5"
                        >
                          {p.name} <span className="text-muted">— {p.brand}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <NavLink
            to="/wishlist"
            aria-label={`Wishlist, ${wishlist.length} items`}
            className="relative p-2 rounded-full hover:bg-primary/5 dark:hover:bg-white/5 text-text dark:text-surface hidden sm:inline-flex"
          >
            <RiHeartLine size={20} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] text-white">
                {wishlist.length}
              </span>
            )}
          </NavLink>

          <button
            aria-label="Toggle high contrast mode"
            onClick={() => document.documentElement.classList.toggle('high-contrast')}
            className="hidden md:inline-flex p-2 rounded-full hover:bg-primary/5 dark:hover:bg-white/5 text-text dark:text-surface"
          >
            <RiContrastLine size={20} />
          </button>



          <button
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden p-2 rounded-full hover:bg-primary/5 dark:hover:bg-white/5 text-text dark:text-surface"
          >
            <RiMenuLine size={22} />
          </button>
        </div>
      </div>
      </header>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} links={NAV_LINKS} />
    </>
  );
}
