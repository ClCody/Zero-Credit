/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carnival: {
          darkest: '#0A0A10',
          dark: '#12121C',
          card: '#1A1A28',
          border: '#2C2C40',
          accent: '#E11D48',
          gold: '#F59E0B',
          cyan: '#06B6D4',
          lunar: '#9333EA',
          emerald: '#10B981',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Cinzel', 'Trajan Pro', 'serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(225, 29, 72, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(225, 29, 72, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
