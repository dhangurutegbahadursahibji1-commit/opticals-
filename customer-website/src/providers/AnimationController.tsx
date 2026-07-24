import { createContext, useContext, useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { useScroll } from './ScrollProvider';

// Register plugins once
gsap.registerPlugin(ScrollTrigger);

interface AnimationControllerValue {
  // Can expose utility functions here later if needed
}

const AnimationControllerContext = createContext<AnimationControllerValue | undefined>(undefined);

export function AnimationController({ children }: { children: ReactNode }) {
  const { lenis } = useScroll();

  useEffect(() => {
    if (!lenis) return;

    // Connect GSAP ScrollTrigger to Lenis scroll events
    lenis.on('scroll', ScrollTrigger.update);

    // Sync GSAP's ticker with Lenis requestAnimationFrame
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000); // GSAP's time is in seconds, Lenis expects ms
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', ScrollTrigger.update);
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, [lenis]);

  return (
    <AnimationControllerContext.Provider value={{}}>
      {children}
    </AnimationControllerContext.Provider>
  );
}

export function useAnimationController() {
  const context = useContext(AnimationControllerContext);
  if (context === undefined) {
    throw new Error('useAnimationController must be used within an AnimationController');
  }
  return context;
}
