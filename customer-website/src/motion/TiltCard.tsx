import { useRef, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  idleFloat?: boolean;
}

export default function TiltCard({ children, className, maxTilt = 8, idleFloat = false }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { reduced } = useReducedMotionPref();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const springRx = useSpring(rx, { stiffness: 200, damping: 20 });
  const springRy = useSpring(ry, { stiffness: 200, damping: 20 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.22), transparent 60%)`,
  );

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ry.set((px - 0.5) * maxTilt * 2);
    rx.set(-(py - 0.5) * maxTilt * 2);
    glareX.set(px * 100);
    glareY.set(py * 100);
  };
  const handleLeave = () => { rx.set(0); ry.set(0); };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      animate={!reduced && idleFloat ? { y: [0, -6, 0] } : undefined}
      transition={idleFloat ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      style={reduced ? undefined : { rotateX: springRx, rotateY: springRy, transformStyle: 'preserve-3d' }}
      className={`relative ${className ?? ''}`}
    >
      {children}
      {!reduced && (
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: glareBackground }} />
      )}
    </motion.div>
  );
}