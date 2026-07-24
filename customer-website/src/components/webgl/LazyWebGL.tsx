import { Suspense, lazy, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useMotionPreferences } from '../../providers/MotionPreferences';

// Lazy load the heavy background
const FluidBackground = lazy(() => import('./FluidBackground'));

export default function LazyWebGL() {
  const { motionTier, gpuQuality } = useMotionPreferences();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Small delay to ensure priority is given to LCP (Largest Contentful Paint)
    const timer = setTimeout(() => {
      setMounted(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (motionTier === 'none') {
    return (
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-surface to-accent/20" />
    );
  }

  if (!mounted) return null;

  // Determine dpr (device pixel ratio)
  // Lower it for mobile/low-end devices to preserve battery and frame rate
  const dpr = gpuQuality === 'LOW' ? 1 : gpuQuality === 'MEDIUM' ? [1, 1.5] : [1, 2];

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-dark-bg">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        dpr={dpr as any}
        gl={{ powerPreference: 'high-performance', antialias: false }} // post-processing/shaders usually don't need MSAA
      >
        <Suspense fallback={null}>
          <FluidBackground quality={gpuQuality} />
        </Suspense>
      </Canvas>
      {/* Overlay to give it a frosted/dark look */}
      <div className="absolute inset-0 bg-surface/80 mix-blend-overlay" />
    </div>
  );
}
