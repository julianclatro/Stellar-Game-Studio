/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        detective: {
          bg: '#0a0a0f',
          surface: '#14141f',
          'surface-light': '#1e1e2e',
          border: 'rgba(232, 230, 227, 0.08)',
          ink: '#e8e6e3',
          muted: '#8a8a9a',
          gold: '#d4a843',
          'gold-dim': 'rgba(212, 168, 67, 0.15)',
          crimson: '#c8463b',
          'crimson-dim': 'rgba(200, 70, 59, 0.15)',
          teal: '#2a9d8f',
          'teal-dim': 'rgba(42, 157, 143, 0.15)',
        },
      },
    },
  },
  plugins: [],
};
