import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#EFF8F6',
          100: '#D7EEEA',
          300: '#7FC4BC',
          500: '#27877D',
          600: '#176B63',
          700: '#11554F',
          800: '#0E443F',
          900: '#0B3733',
          950: '#062623',
        },
        marigold: {
          300: '#F8D07A',
          500: '#ED9F1C',
          600: '#D08412',
        },
        sand: {
          50: '#FBFAF7',
          100: '#F5F1EA',
          200: '#EAE4DA',
          400: '#A8A094',
          600: '#6B7370',
        },
        ink: '#1E2A28',
        success: '#1E9E6A',
        danger: { DEFAULT: '#DC3B3B', dark: '#B02A2A' },
        warning: '#C9810C',
        info: '#2B7FD9',
        rose: '#E0564F',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(14,68,63,.06), 0 8px 24px -12px rgba(14,68,63,.18)',
        pop: '0 12px 40px -12px rgba(6,38,35,.35)',
      },
      borderRadius: {
        xl2: '24px',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        pop: {
          '0%': { transform: 'scale(0.6)' },
          '60%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite',
        pop: 'pop 220ms cubic-bezier(.22,1,.36,1)',
        fadeUp: 'fadeUp 220ms cubic-bezier(.22,1,.36,1)',
      },
    },
  },
  plugins: [],
};

export default config;
