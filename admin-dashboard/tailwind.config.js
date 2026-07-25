/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // These point to CSS variables set at runtime from the store's Settings.
        // The fallback values are the defaults shown before settings load.
        // This means `bg-primary`, `text-accent`, `border-accent`, etc. all
        // update automatically when a client changes their brand colors —
        // no rebuild needed.
        primary: 'var(--color-primary, #0B1D3A)',
        accent:  'var(--color-accent, #C6973F)',
        surface: '#F4F6F9',
      },
    },
  },
  plugins: [],
};