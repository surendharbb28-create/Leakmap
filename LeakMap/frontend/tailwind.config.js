/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#12181C',
        panel: '#1B2328',
        panelAlt: '#202A30',
        line: '#2A343A',
        text: '#E8EDF0',
        textDim: '#8B99A0',
        safe: '#2F8F72',
        warn: '#E8A33D',
        danger: '#D94F4F',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
