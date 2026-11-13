/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#09090b',
        bg2: '#0e0e11',
        s1: '#141417',
        s2: '#1a1a1f',
        line: 'rgba(255,255,255,0.08)',
        line2: 'rgba(255,255,255,0.16)',
        textMain: '#f4f4f5',
        mid: '#a1a1aa',
        low: '#71717a',
        green: '#4ade80',
        red: '#f87171',
        // Compatibility tokens
        background: '#09090b',
        'background-secondary': '#0e0e11',
        surface: '#141417',
        'surface-elevated': '#1a1a1f',
        'surface-hover': '#222227',
        primary: {
          DEFAULT: '#4ade80',
          hover: '#39e58c',
          glow: 'rgba(74, 222, 128, 0.25)',
        },
        secondary: {
          DEFAULT: '#20B875',
        },
        secondaryText: '#a1a1aa',
        mutedText: '#71717a',
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.08)',
          hover: 'rgba(255,255,255,0.16)',
        },
        status: {
          success: '#4ade80',
          warning: '#E9B85C',
          error: '#f87171',
          info: '#38BDF8',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'card': '20px',
        'btn': '999px',
        'pill': '999px',
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(74, 222, 128, 0.18)',
        'glow-md': '0 0 35px rgba(74, 222, 128, 0.28)',
        'glow-lg': '0 0 60px rgba(74, 222, 128, 0.35)',
        'elevated': '0 20px 45px -10px rgba(0, 0, 0, 0.7)',
        'btn-inset': '0 1px 0 rgba(255,255,255,0.6) inset, 0 8px 24px rgba(0,0,0,0.4)',
      },
      transitionTimingFunction: {
        'joverse': 'cubic-bezier(.16, 1, .3, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite',
        'marquee': 'slide 40s linear infinite',
      },
      keyframes: {
        slide: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
