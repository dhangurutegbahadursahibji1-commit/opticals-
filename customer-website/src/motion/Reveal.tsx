import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { DURATION, EASE } from '../lib/motion';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';

type RevealVariant = 'fade-up' | 'fade' | 'scale' | 'slide-left' | 'slide-right' | 'blur';

const VARIANTS: Record<RevealVariant, Variants> = {
  'fade-up': { hidden: { opacity: 0, y: 32 }, show: { opacity: 1, y: 0 } },
  fade: { hidden: { opacity: 0 }, show: { opacity: 1 } },
  scale: { hidden: { opacity: 0, scale: 0.92 }, show: { opacity: 1, scale: 1 } },
  'slide-left': { hidden: { opacity: 0, x: 48 }, show: { opacity: 1, x: 0 } },
  'slide-right': { hidden: { opacity: 0, x: -48 }, show: { opacity: 1, x: 0 } },
  blur: { hidden: { opacity: 0, filter: 'blur(12px)' }, show: { opacity: 1, filter: 'blur(0px)' } },
};

interface RevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  once?: boolean;
}

export default function Reveal({ children, variant = 'fade-up', delay = 0, className, once = true }: RevealProps) {
  const { reduced } = useReducedMotionPref();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={VARIANTS[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: DURATION.base, ease: EASE.out, delay }}
    >
      {children}
    </motion.div>
  );
}

export function RevealGroup({ children, className, stagger = 0.08 }: { children: ReactNode; className?: string; stagger?: number }) {
  const { reduced } = useReducedMotionPref();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export function RevealItem({ children, className, variant = 'fade-up' }: { children: ReactNode; className?: string; variant?: RevealVariant }) {
  const { reduced } = useReducedMotionPref();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={VARIANTS[variant]} transition={{ duration: DURATION.base, ease: EASE.out }}>
      {children}
    </motion.div>
  );
}