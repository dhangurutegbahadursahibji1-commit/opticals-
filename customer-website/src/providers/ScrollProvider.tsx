import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { useMotionPreferences } from './MotionPreferences';
import { useAccessibility } from './AccessibilityProvider';

interface ScrollContextValue {
  lenis: Lenis | null;
  scrollTo: (target: string | HTMLElement | number, options?: any) => void;
  pause: () => void;
  resume: () => void;
  refresh: () => void;
}

const ScrollContext = createContext<ScrollContextValue | undefined>(undefined);

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const { isTouch } = useMotionPreferences();
  const { isReducedMotion } = useAccessibility();

  useEffect(() => {
    // Disable Lenis for touch devices or if reduced motion is preferred
    if (isTouch || isReducedMotion) {
      return;
    }

    const lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // luxury easing
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    setLenis(lenisInstance);

    function raf(time: number) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenisInstance.destroy();
      setLenis(null);
    };
  }, [isTouch, isReducedMotion]);

  const value: ScrollContextValue = {
    lenis,
    scrollTo: (target, options) => lenis?.scrollTo(target, options),
    pause: () => lenis?.stop(),
    resume: () => lenis?.start(),
    refresh: () => lenis?.resize(),
  };

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}

export function useScroll() {
  const context = useContext(ScrollContext);
  if (context === undefined) {
    throw new Error('useScroll must be used within a ScrollProvider');
  }
  return context;
}
