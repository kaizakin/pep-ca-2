/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#e68f5e',
          dark: '#0a0a0a',
          panel: '#151a1e',
          border: '#272f38',
          text: '#9ca3af',
        }
      }
    }
  },
  plugins: []
};
