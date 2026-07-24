import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';

// Adaptive-contrast "paintball" cursor.
//
// mix-blend-mode: difference inverts the cursor's own pixel color against
// whatever is underneath it, which is why a plain white fill always renders
// as the highest-contrast color for any background automatically — no
// per-pixel sampling needed. On hover over an interactive element it "splats"
// into a soft paint-drop shape.
//
// Bug fix: this previously imported '../../hooks/useReducedMotionPref', which
// resolves OUTSIDE src/ (this file lives at src/motion/CustomCursor.tsx, so
// only one '../' is needed to reach src/hooks). That failed module
// resolution and crashed this component, which is why the cursor vanished.
export default function CustomCursor() {
  const { reduced } = useReducedMotionPref();
  const [enabled, setEnabled] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [clicking, setClicking] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 500, damping: 40 });
  const springY = useSpring(y, { stiffness: 500, damping: 40 });

  useEffect(() => {
    setEnabled(window.matchMedia('(pointer: fine)').matches && !reduced);
  }, [reduced]);

  useEffect(() => {
    if (!enabled) return;
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setHovering(!!(e.target as HTMLElement).closest('[data-cursor="hover"]'));
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = hovering ? 44 : clicking ? 14 : 20;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[999] rounded-full bg-white mix-blend-difference"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
        boxShadow: hovering ? '0 0 18px 4px rgba(255,255,255,0.35)' : '0 0 6px 1px rgba(255,255,255,0.25)',
      }}
      animate={{ width: size, height: size, opacity: 1, borderRadius: hovering ? '38% 62% 55% 45% / 45% 40% 60% 55%' : '9999px' }}
      initial={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    />
  );
}