/** @type {import('tailwindcss').Config} */
//
// Accenture Branding Guidelines July 2025 v4.
//
// This config both registers the official Accenture token palette AND
// remaps the most-used Tailwind default shades (pink, rose, red, orange,
// amber, emerald) onto Accenture equivalents. That keeps existing class
// names in ~60 component files working while making them render brand-
// compliant without a bulk find-replace. Slate/gray are left alone so
// neutral chrome (cards, borders, muted text) continues to work.
//
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official Accenture palette — use these for net-new UI going forward.
        accenture: {
          purple: {
            darkest:  '#460073',
            dark:     '#7500C0',
            DEFAULT:  '#A100FF',
            light:    '#C2A3FF',
            lightest: '#E6DCFF',
          },
          black:            '#000000',
          'gray-dark':      '#818180',
          'gray-light':     '#CFCFCF',
          'gray-off-white': '#F1F1EF',
          white:            '#FFFFFF',
          pink:  '#FF50A0',
          blue:  '#224BFF',
          aqua:  '#05F2DB',
        },

        // ── Brand-compliant remaps of high-frequency default palettes ──────
        // Every existing `bg-pink-600` / `text-emerald-500` etc. still works
        // but renders in Accenture colors instead of stock Tailwind.
        pink: {
          50:  '#FFF0F6',
          100: '#FFE0EC',
          200: '#FFC2D7',
          300: '#FFA3C2',
          400: '#FF85AD',
          500: '#FF50A0', // Accenture pink
          600: '#E6458F',
          700: '#CC3A7E',
          800: '#B32F6D',
          900: '#99235C',
        },
        rose: {
          50:  '#FFF0F6',
          100: '#FFE0EC',
          300: '#FFA3C2',
          500: '#FF50A0',
          600: '#E6458F',
          700: '#CC3A7E',
        },
        red: {
          50:  '#FFF0F6',
          100: '#FFE0EC',
          300: '#FFA3C2',
          500: '#FF50A0',
          600: '#E6458F',
          700: '#CC3A7E',
        },
        emerald: {
          50:  '#E6DCFF',  // purple-lightest (success background, light mode)
          100: '#E6DCFF',
          200: '#C2A3FF',
          300: '#C2A3FF',
          400: '#A100FF',
          500: '#7500C0',  // purple-dark (success accent)
          600: '#7500C0',
          700: '#460073',  // purple-darkest
          800: '#460073',
          900: '#460073',
          950: '#2D0049',
        },
        amber: {
          50:  '#E6DCFF',
          100: '#E6DCFF',
          200: '#C2A3FF',
          300: '#C2A3FF',
          400: '#A100FF',
          500: '#A100FF',
          600: '#7500C0',
          700: '#7500C0',
          800: '#460073',
          900: '#460073',
        },
        orange: {
          50:  '#E6DCFF',
          100: '#E6DCFF',
          500: '#A100FF',
          600: '#7500C0',
          700: '#460073',
        },
      },
      fontFamily: {
        // Graphik is Accenture's primary face. Falls back to Inter then
        // system sans, so hosts without Graphik still render a modern
        // geometric sans (no serif fallback ever).
        sans: [
          '"Graphik"', '"Graphik Web"',
          'Inter', 'ui-sans-serif', 'system-ui', '-apple-system',
          'BlinkMacSystemFont', 'Segoe UI', 'sans-serif',
        ],
        sectra: ['"GT Sectra"', 'Georgia', 'serif'],
      },
      keyframes: {
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(4px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':        'fade-in 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}
