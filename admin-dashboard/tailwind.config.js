/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0B1D3A',
        accent: '#C6973F',
        surface: '#F4F6F9',
      },
    },
  },
  plugins: [],
};
