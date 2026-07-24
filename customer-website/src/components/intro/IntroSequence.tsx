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
}

function taglineLines(tagline: string | undefined, storeName: string | undefined): string[] {
  const defaultLine = storeName ? `Welcome to ${storeName}` : 'We care about your vision.';
  const words = (tagline || defaultLine).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [defaultLine.toUpperCase()];
  const chunkSize = Math.max(1, Math.ceil(words.length / 3));
  const lines: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    lines.push(words.slice(i, i + chunkSize).join(' ').toUpperCase());
  }
  return lines.slice(0, 3);
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

export default function IntroSequence({ onComplete, tagline, storeName }: IntroSequenceProps) {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'rims' | 'temples' | 'text' | 'exit'>('rims');
  const { reduced } = useReducedMotionPref();
  const lines = taglineLines(tagline, storeName);
  const lastLine = lines[lines.length - 1];

  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
    onComplete();
  };

  useEffect(() => {
    // Hard fallback — always dismiss within 6 seconds no matter what
    const hardFallback = setTimeout(finish, 6000);

    if (reduced) {
      clearTimeout(hardFallback);
      finish();
      return;
    }

    // Phase timeline
    const t1 = setTimeout(() => setPhase('temples'), 1200);  // rims drawn
    const t2 = setTimeout(() => setPhase('text'), 1900);     // temples open
    const t3 = setTimeout(() => setPhase('exit'), 3300);     // text shown, now exit

    return () => {
      clearTimeout(hardFallback);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence onExitComplete={finish}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-surface"
          animate={phase === 'exit' ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.5 }}
          onAnimationComplete={() => { if (phase === 'exit') finish(); }}
        >
          <svg viewBox="-100 -20 1400 640" className="w-[85vw] max-w-3xl" fill="none">
            <g>
              {/* Temple left */}
              <motion.line
                x1="40" y1="110" x2="-120" y2="80"
                stroke={FRAME_STROKE} strokeWidth="16" strokeLinecap="round"
                style={{ transformOrigin: '40px 110px' }}
                initial={{ rotate: 68 }}
                animate={{ rotate: phase === 'rims' ? 68 : 0 }}
                transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
              />
              {/* Temple right */}
              <motion.line
                x1="1160" y1="110" x2="1320" y2="80"
                stroke={FRAME_STROKE} strokeWidth="16" strokeLinecap="round"
                style={{ transformOrigin: '1160px 110px' }}
                initial={{ rotate: -68 }}
                animate={{ rotate: phase === 'rims' ? -68 : 0 }}
                transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
              />

              {/* Bridge */}
              <motion.path
                d={BRIDGE}
                stroke={FRAME_STROKE} strokeWidth="16" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.0, ease: [0.65, 0, 0.35, 1] }}
              />

              {/* Left lens */}
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

              {/* Right lens */}
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

              {/* Hinge slits */}
              <ellipse cx="45" cy="115" rx="12" ry="4" fill="none" stroke={FRAME_STROKE} strokeWidth="4" transform="rotate(-25 45 115)" />
              <ellipse cx="1155" cy="115" rx="12" ry="4" fill="none" stroke={FRAME_STROKE} strokeWidth="4" transform="rotate(25 1155 115)" />
            </g>

            {/* Text inside lenses */}
            <motion.g
              textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={700}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: phase === 'text' || phase === 'exit' ? 1 : 0, y: phase === 'text' || phase === 'exit' ? 0 : 12 }}
              transition={{ duration: 0.5 }}
            >
              {lines.map((line, i) => (
                <text key={i} x="265" y={275 + i * 45} fill={line === lastLine ? ACCENT : FRAME_STROKE} fontSize={line === lastLine ? 38 : 34}>
                  {line}
                </text>
              ))}
            </motion.g>
            <motion.g
              textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={700}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: phase === 'text' || phase === 'exit' ? 1 : 0, y: phase === 'text' || phase === 'exit' ? 0 : 12 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              {lines.map((line, i) => (
                <text key={i} x="935" y={275 + i * 45} fill={line === lastLine ? ACCENT : FRAME_STROKE} fontSize={line === lastLine ? 38 : 34}>
                  {line}
                </text>
              ))}
            </motion.g>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}