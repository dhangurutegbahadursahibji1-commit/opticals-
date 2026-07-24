import { createContext, useContext, type ReactNode } from 'react';
import { useAccessibility } from './AccessibilityProvider';

type MotionTier = 'tier-1' | 'tier-2' | 'tier-3' | 'none';
type GpuQuality = 'LOW' | 'MEDIUM' | 'HIGH' | 'AUTO';

interface MotionPreferencesValue {
  motionTier: MotionTier;
  gpuQuality: GpuQuality;
  isMobile: boolean;
  isTouch: boolean;
}

const MotionPreferencesContext = createContext<MotionPreferencesValue | undefined>(undefined);

export function MotionPreferences({ children }: { children: ReactNode }) {
  const { isReducedMotion } = useAccessibility();
  
  // Basic touch & mobile detection
  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Determine tiers and quality dynamically
  let motionTier: MotionTier = 'tier-3';
  let gpuQuality: GpuQuality = 'AUTO';

  if (isReducedMotion) {
    motionTier = 'none';
    gpuQuality = 'LOW';
  } else if (isMobile || isTouch) {
    motionTier = 'tier-2';
    gpuQuality = 'MEDIUM'; // Save battery on mobile
  }

  // Ideally, AUTO logic would also factor in hardware concurrency or memory
  // const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
  // if (hasLowMemory && gpuQuality !== 'LOW') gpuQuality = 'LOW';

  return (
    <MotionPreferencesContext.Provider value={{ motionTier, gpuQuality, isMobile, isTouch }}>
      {children}
    </MotionPreferencesContext.Provider>
  );
}

export function useMotionPreferences() {
  const context = useContext(MotionPreferencesContext);
  if (context === undefined) {
    throw new Error('useMotionPreferences must be used within a MotionPreferences provider');
  }
  return context;
}
