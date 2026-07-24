import type { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { EASE } from '../lib/motion';

export default function LiquidButton({ children, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      data-cursor="hover"
      className={`group relative overflow-hidden rounded-full border border-accent px-8 py-3.5 font-medium text-accent ${className ?? ''}`}
      {...props}
    >
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-accent"
        initial={{ y: '100%' }}
        whileHover={{ y: 0 }}
        transition={{ duration: 0.4, ease: EASE.inOut }}
      />
      <span className="relative z-10 transition-colors duration-300 group-hover:text-primary">{children}</span>
    </button>
  );
}