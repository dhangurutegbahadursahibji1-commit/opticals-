import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const THEMES = [
  'luxury-white', 'premium-dark', 'minimal-glass', 'royal-blue', 'titanium', 'gold', 'platinum',
] as const;
export type ThemeName = (typeof THEMES)[number];

const THEME_LABELS: Record<ThemeName, string> = {
  'luxury-white': 'Luxury White',
  'premium-dark': 'Premium Dark',
  'minimal-glass': 'Minimal Glass',
  'royal-blue': 'Royal Blue',
  titanium: 'Titanium',
  gold: 'Gold',
  platinum: 'Platinum',
};

const THEME_IS_DARK: Record<ThemeName, boolean> = {
  'luxury-white': false,
  'premium-dark': false, // Disabled globally for now
  'minimal-glass': false,
  'royal-blue': false,   // Disabled globally for now
  titanium: false,
  gold: false,
  platinum: false,
};

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  labels: typeof THEME_LABELS;
  isDark: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = 'ao_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeName | null;
    return stored && THEMES.includes(stored) ? stored : 'luxury-white';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', THEME_IS_DARK[theme]);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const isDark = THEME_IS_DARK[theme];
  const toggleDark = () => setTheme(isDark ? 'luxury-white' : 'premium-dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, labels: THEME_LABELS, isDark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}