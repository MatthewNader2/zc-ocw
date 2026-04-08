/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Zewail City brand palette
        zc: {
          navy:    '#0B1F3A',   // deep university navy
          blue:    '#1A3A6B',   // primary blue
          sky:     '#2A6CC4',   // interactive blue
          gold:    '#C9A84C',   // accent gold
          'gold-light': '#E8C97A',
          'gold-muted': '#8A6E2F',
          ivory:   '#F8F5EE',   // warm off-white
          slate:   '#F1F3F7',   // light bg
          gray:    '#6B7280',
          dark:    '#0D0D0D',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"Source Sans 3"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'hero-pattern': "url('/pattern.svg')",
      },
      animation: {
        'fade-up':   'fadeUp 0.6s ease forwards',
        'fade-in':   'fadeIn 0.4s ease forwards',
        'shimmer':   'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
