// Single source of truth for animation timing across the app. Nothing outside
// this file should hardcode a duration or easing curve — that's what causes
// the "15 animation types feel inconsistent" problem the roadmap flags.

export const DURATION = {
  instant: 0.15,
  fast: 0.3,
  base: 0.5,
  slow: 0.8,
  slower: 1.2,
  intro: 1.1,
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1],       // premium "expo-out" — most UI motion
  inOut: [0.65, 0, 0.35, 1],    // symmetric — page transitions, wipes
  overshoot: [0.34, 1.56, 0.64, 1], // slight bounce — temples unfolding, toasts
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.base, ease: EASE.out } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.base, ease: EASE.out } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { duration: DURATION.base, ease: EASE.out } },
};