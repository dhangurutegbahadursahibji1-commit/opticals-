import { useReducedMotion } from 'framer-motion';

/**
 * The one place the reduced-motion decision is made. Every motion component
 * imports THIS hook (not framer-motion's directly) — if the fallback strategy
 * ever needs to change (skip vs shorten vs replace-with-fade), it changes here
 * and every consumer picks it up automatically.
 */
export function useReducedMotionPref() {
  const prefersReduced = useReducedMotion();
  return { reduced: !!prefersReduced };
}
