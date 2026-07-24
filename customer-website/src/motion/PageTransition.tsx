import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useOutlet } from 'react-router-dom';
import { EASE } from '../lib/motion';
import { useReducedMotionPref } from '../hooks/useReducedMotionPref';

export default function PageTransition() {
  const location = useLocation();
  const outlet = useOutlet();
  const { reduced } = useReducedMotionPref();

  if (reduced) return <>{outlet}</>;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ clipPath: 'circle(0% at 50% 50%)' }}
        animate={{ clipPath: 'circle(150% at 50% 50%)' }}
        exit={{ clipPath: 'circle(0% at 50% 50%)' }}
        transition={{ duration: 0.7, ease: EASE.inOut }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}