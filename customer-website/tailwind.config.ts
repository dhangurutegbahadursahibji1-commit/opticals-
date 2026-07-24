import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-light': 'rgb(var(--color-accent-light) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'dark-bg': 'rgb(var(--color-dark-bg) / <alpha-value>)',
        'dark-card': 'rgb(var(--color-dark-card) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        error: '#DC2626',
        success: '#16A34A',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '1rem',
      },
      keyframes: {
        'shimmer-border': {
          '0%': { '--angle': '0deg' } as Record<string, string>,
          '100%': { '--angle': '360deg' } as Record<string, string>,
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glass-shine': {
          '0%': { transform: 'translateX(-150%) skewX(-20deg)' },
          '100%': { transform: 'translateX(150%) skewX(-20deg)' },
        },
      },
      animation: {
        'shimmer-border': 'shimmer-border 2s linear infinite',
        float: 'float 4s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out both',
        'glass-shine': 'glass-shine 1.2s ease-in-out',
      },
      transitionTimingFunction: {
        'luxury-ease': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'luxury-in': 'cubic-bezier(0.25, 0, 1, 1)',
        'luxury-out': 'cubic-bezier(0, 0, 0.5, 1)',
        'luxury-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        'fast': '200ms',
        'page': '400ms',
        'narrative': '1000ms',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} satisfies Config;
