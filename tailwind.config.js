/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#03045e',
          900: '#023e8a',
          700: '#0077b6',
          600: '#0096c7',
          500: '#00b4d8',
          400: '#48cae4',
          300: '#90e0ef',
          200: '#ade8f4',
          100: '#caf0f8',
          50:  '#f0fbfe',
        },
        school: {
          csai:        '#0096c7',
          business:    '#0d9488',
          science:     '#7c3aed',
          engineering: '#ea580c',
          general:     '#64748b',
        },
        surface: {
          DEFAULT: '#f8fafc',
          card:    '#ffffff',
          muted:   '#f1f5f9',
        },
        ink: {
          DEFAULT: '#03045e',
          muted:   '#334155',
          subtle:  '#64748b',
          ghost:   '#94a3b8',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body:    ['"Plus Jakarta Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow':      '0 0 20px rgba(0,180,216,0.25)',
        'glow-lg':   '0 0 40px rgba(0,180,216,0.30)',
        'card':      '0 1px 3px rgba(3,4,94,0.06), 0 4px 16px rgba(3,4,94,0.06)',
        'card-hover':'0 4px 6px rgba(3,4,94,0.04), 0 16px 48px rgba(3,4,94,0.12)',
        'deep':      '0 20px 60px rgba(3,4,94,0.20)',
      },
      backgroundImage: {
        'grid':    "url(\"data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cpath d='M0 0h48v1H0zM0 0v48h1V0z' fill='%23ffffff' fill-opacity='0.04'/%3E%3C/g%3E%3C/svg%3E\")",
        'dots':    "url(\"data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='%230096c7' fill-opacity='0.12'/%3E%3C/svg%3E\")",
        'hero-mesh': 'radial-gradient(ellipse 80% 70% at 5% 55%, rgba(0,150,199,0.28) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 95% 15%, rgba(0,180,216,0.18) 0%, transparent 50%), radial-gradient(ellipse 40% 60% at 50% 100%, rgba(2,62,138,0.40) 0%, transparent 60%)',
      },
      animation: {
        'fade-up':     'fadeUp 0.65s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':     'fadeIn 0.4s ease both',
        'slide-right': 'slideRight 0.55s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':    'scaleIn 0.3s cubic-bezier(0.16,1,0.3,1) both',
        'float':       'float 4s ease-in-out infinite',
        'shimmer':     'shimmer 1.5s linear infinite',
        'pulse-ring':  'pulseRing 2s ease-out infinite',
        'slide-up-in': 'slideUpIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        fadeUp:     { from:{opacity:0,transform:'translateY(28px)'}, to:{opacity:1,transform:'translateY(0)'} },
        fadeIn:     { from:{opacity:0}, to:{opacity:1} },
        slideRight: { from:{opacity:0,transform:'translateX(-20px)'}, to:{opacity:1,transform:'translateX(0)'} },
        scaleIn:    { from:{opacity:0,transform:'scale(0.93)'}, to:{opacity:1,transform:'scale(1)'} },
        float:      { '0%,100%':{transform:'translateY(0)'}, '50%':{transform:'translateY(-10px)'} },
        shimmer:    { '0%':{backgroundPosition:'-200% 0'}, '100%':{backgroundPosition:'200% 0'} },
        pulseRing:  { '0%':{boxShadow:'0 0 0 0 rgba(0,180,216,0.5)'}, '70%':{boxShadow:'0 0 0 12px rgba(0,180,216,0)'}, '100%':{boxShadow:'0 0 0 0 rgba(0,180,216,0)'} },
        slideUpIn:  { from:{opacity:0,transform:'translateY(12px)'}, to:{opacity:1,transform:'translateY(0)'} },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
