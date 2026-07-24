import { useState } from 'react';
import { RiPaletteLine } from 'react-icons/ri';
import { THEMES, useTheme } from '../../context/ThemeContext';

// Drop this anywhere — e.g. in Navbar.tsx or Footer.tsx — to let visitors
// (or you, during a client demo) switch between the 7 branded themes live.
export default function ThemeSwitcher() {
  const { theme, setTheme, labels } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch theme"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/15 dark:border-white/15 text-primary dark:text-surface"
      >
        <RiPaletteLine size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-dark-card p-2 shadow-lg">
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => { setTheme(t); setOpen(false); }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                theme === t ? 'bg-accent/10 text-accent font-medium' : 'text-text dark:text-surface/80 hover:bg-primary/5 dark:hover:bg-white/5'
              }`}
            >
              {labels[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
