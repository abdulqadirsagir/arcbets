/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Neon Pulse Theme - Deep Navy Base
        'arc-primary': '#A855F7',
        'arc-secondary': '#C084FC',
        'arc-bg': '#0A0F1E',
        'arc-card': '#111827',
        'arc-dark': '#0A0F1E',
        'arc-darker': '#050811',
        // Neon Accents
        'neon-purple': '#A855F7',
        'neon-pink': '#C084FC',
        'neon-green': '#22C55E',
        'neon-red': '#EF4444',
        'neon-blue': '#3B82F6',
        'cool-gray': '#6B7280',
      },
      boxShadow: {
        'neon': '0 0 10px rgba(168, 85, 247, 0.5)',
        'neon-strong': '0 0 20px rgba(168, 85, 247, 0.7)',
        'neon-green': '0 0 10px rgba(34, 197, 94, 0.5)',
        'neon-red': '0 0 10px rgba(239, 68, 68, 0.5)',
        'neon-blue': '0 0 10px rgba(59, 130, 246, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.5s ease-out',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.8)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
