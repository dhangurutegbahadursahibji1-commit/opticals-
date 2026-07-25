import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotionPref } from '../../hooks/useReducedMotionPref';

const SESSION_KEY = 'ao_intro_seen';
const FRAME_STROKE = '#0B1D3A';
const ACCENT = '#C6973F';

interface IntroSequenceProps {
  onComplete: () => void;
  tagline?: string;
  storeName?: string;
  introLine1?: string;
  introLine2?: string;
}

const LENS_LEFT =
  'M 40,110 C 150,90 350,100 460,120 ' +
  'C 490,130 490,150 480,180 ' +
  'C 460,280 430,360 380,400 ' +
  'C 300,460 200,450 120,400 ' +
  'C 70,350 40,250 40,110 Z';

const LENS_RIGHT =
  'M 1160,110 C 1050,90 850,100 740,120 ' +
  'C 710,130 710,150 720,180 ' +
  'C 740,280 770,360 820,400 ' +
  'C 900,460 1000,450 1080,400 ' +
  'C 1130,350 1160,250 1160,110 Z';

const BRIDGE = 'M 460,120 C 500,100 700,100 740,120';

export default function IntroSequence({ onComplete, introLine1, introLine2, storeName }: IntroSequenceProps) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'rims' | 'temples' | 'text' | 'exit'>('rims');
  const { reduced } = useReducedMotionPref();

  // called exactly once — after AnimatePresence fully removes the node from DOM
  const done = useRef(false);
  const handleDone = () => {
    if (done.current) return;
    done.current = true;
    sessionStorage.setItem(SESSION_KEY, '1');
    onComplete();
  };

  // starts the exit — just sets visible=false, lets AnimatePresence animate
  // it out, then handleDone fires via onExitComplete. Never calls onComplete directly.
  const startExit = () => {
    if (done.current) return;
    setVisible(false);
  };

  useEffect(() => {
    if (reduced) {
      handleDone();
      return;
    }

    const t1 = setTimeout(() => setPhase('temples'), 1200);
    const t2 = setTimeout(() => setPhase('text'),    1900);
    const t3 = setTimeout(() => setPhase('exit'),    3300);
    const t4 = setTimeout(startExit,                 6000); // hard fallback

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when phase hits 'exit', wait for the fade (0.5s) then unmount
  useEffect(() => {
    if (phase !== 'exit') return;
    const t = setTimeout(startExit, 520);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const leftText  = (introLine1 || (storeName ? `Welcome to ${storeName}` : 'WE CARE')).toUpperCase();
  const rightText = (introLine2 || 'ABOUT YOUR VISION').toUpperCase();

  return (
    <AnimatePresence onExitComplete={handleDone}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-surface"
          animate={phase === 'exit' ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg viewBox="-100 -20 1400 640" className="w-[85vw] max-w-3xl" fill="none">
            <g>
              <motion.line
                x1="40" y1="110" x2="-120" y2="80"
                stroke={FRAME_STROKE} strokeWidth="16" strokeLinecap="round"
                style={{ transformOrigin: '40px 110px' }}
                initial={{ rotate: 68 }}
                animate={{ rotate: phase === 'rims' ? 68 : 0 }}
                transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
              />
              <motion.line
                x1="1160" y1="110" x2="1320" y2="80"
                stroke={FRAME_STROKE} strokeWidth="16" strokeLinecap="round"
                style={{ transformOrigin: '1160px 110px' }}
                initial={{ rotate: -68 }}
                animate={{ rotate: phase === 'rims' ? -68 : 0 }}
                transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
              />
              <motion.path
                d={BRIDGE}
                stroke={FRAME_STROKE} strokeWidth="16" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.0, ease: [0.65, 0, 0.35, 1] }}
              />
              <motion.path d={LENS_LEFT} fill={FRAME_STROKE}
                initial={{ fillOpacity: 0 }}
                animate={{ fillOpacity: phase === 'temples' ? 0.08 : 0 }}
                transition={{ duration: 0.35 }}
                stroke="none"
              />
              <motion.path
                d={LENS_LEFT}
                stroke={FRAME_STROKE} strokeWidth="16" strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.0, ease: [0.65, 0, 0.35, 1] }}
              />
              <motion.path d={LENS_RIGHT} fill={FRAME_STROKE}
                initial={{ fillOpacity: 0 }}
                animate={{ fillOpacity: phase === 'temples' ? 0.08 : 0 }}
                transition={{ duration: 0.35 }}
                stroke="none"
              />
              <motion.path
                d={LENS_RIGHT}
                stroke={FRAME_STROKE} strokeWidth="16" strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.0, ease: [0.65, 0, 0.35, 1] }}
              />
              <ellipse cx="45" cy="115" rx="12" ry="4" fill="none" stroke={FRAME_STROKE} strokeWidth="4" transform="rotate(-25 45 115)" />
              <ellipse cx="1155" cy="115" rx="12" ry="4" fill="none" stroke={FRAME_STROKE} strokeWidth="4" transform="rotate(25 1155 115)" />
            </g>

            <motion.g
              textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={700}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: phase === 'text' || phase === 'exit' ? 1 : 0, y: phase === 'text' || phase === 'exit' ? 0 : 12 }}
              transition={{ duration: 0.5 }}
            >
              <text x="265" y="275" fill={FRAME_STROKE} fontSize={34}>{leftText}</text>
            </motion.g>

            <motion.g
              textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={700}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: phase === 'text' || phase === 'exit' ? 1 : 0, y: phase === 'text' || phase === 'exit' ? 0 : 12 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <text x="935" y="275" fill={ACCENT} fontSize={38}>{rightText}</text>
            </motion.g>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}