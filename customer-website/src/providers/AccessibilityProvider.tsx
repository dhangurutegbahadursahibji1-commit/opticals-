import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AccessibilityContextValue {
  isReducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'normal' | 'large';
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  // Defaulting to false and normal, as setters were unused.
  const highContrast = false;
  const fontSize = 'normal';

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <AccessibilityContext.Provider value={{ isReducedMotion, highContrast, fontSize }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
