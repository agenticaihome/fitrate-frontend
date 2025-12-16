/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'fit-dark': '#0a0a0f',
        'fit-card': '#1a1a2e',
        'fit-cyan': '#00d4ff',
        'fit-pink': '#ff0080',
        'fit-green': '#00ff88',
      },
      fontFamily: {
        'display': ['SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'scan': 'scan 1.5s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
      },
      keyframes: {
        scan: {
          '0%': { top: '0' },
          '50%': { top: 'calc(100% - 4px)' },
          '100%': { top: '0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
