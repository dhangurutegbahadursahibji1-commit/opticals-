import { AnimatePresence, motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { RiCloseLine } from 'react-icons/ri';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  links: { to: string; label: string }[];
}

export default function MobileDrawer({ open, onClose, links }: MobileDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/40 lg:hidden"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed right-0 top-0 z-[100] h-full w-72 bg-surface dark:bg-dark-bg p-6 lg:hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <span className="font-display text-xl text-primary dark:text-surface">Menu</span>
              <button aria-label="Close menu" onClick={onClose} className="p-2">
                <RiCloseLine size={24} />
              </button>
            </div>
            <nav className="flex flex-col gap-4">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `text-lg font-medium ${isActive ? 'text-accent' : 'text-text dark:text-surface/90'}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              <NavLink to="/wishlist" onClick={onClose} className="text-lg font-medium text-text dark:text-surface/90">
                Wishlist
              </NavLink>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
