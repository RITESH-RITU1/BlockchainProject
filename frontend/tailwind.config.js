/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        // Enforce strict Warm Palette
        stone: {
          200: '#e7e5e4',
          800: '#292524',
          900: '#1c1917',
        },
        amber: {
          500: '#f59e0b',
          600: '#d97706',
          950: '#451a03',
        },
        orange: {
          600: '#ea580c',
          700: '#c2410c',
          950: '#431407',
        },
        emerald: {
          600: '#059669',
          700: '#047857',
        },
        red: {
          300: '#fca5a5',
          950: '#450a0a',
        }
      }
    },
  },
  plugins: [],
};
