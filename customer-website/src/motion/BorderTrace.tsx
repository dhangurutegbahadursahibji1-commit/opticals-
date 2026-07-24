import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';

export default function BorderTrace({ children, className, radius = 16, color = '#E8C97A' }: {
  children: ReactNode; className?: string; radius?: number; color?: string;
}) {
  const { reduced } = useReducedMotionPref();
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} style={{ borderRadius: radius }}>
      {!reduced && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <motion.rect
            x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)"
            rx={radius} ry={radius} pathLength={1}
            fill="none" stroke={color} strokeWidth="2" strokeDasharray="0.15 1"
            animate={{ strokeDashoffset: [0, -1] }}
            transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
          />
        </svg>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}