/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ds: {
          'bg-deep': 'var(--ds-bg-deep)',
          'bg-card': 'var(--ds-bg-card)',
          'bg-surface': 'var(--ds-bg-surface)',
          'accent-cyan': 'var(--ds-accent-cyan)',
          'accent-cyan-dim': 'var(--ds-accent-cyan-dim)',
          'accent-green': 'var(--ds-accent-green)',
          'border': 'var(--ds-border)',
          'border-hover': 'var(--ds-border-hover)',
          'text-primary': 'var(--ds-text-primary)',
          'text-secondary': 'var(--ds-text-secondary)',
          'text-muted': 'var(--ds-text-muted)',
          'red': 'var(--ds-red)',
          'amber': 'var(--ds-amber)',
          'grid-line': 'var(--ds-grid-line)',
        },
        brand: {
          dark: '#030014', // Deep space black/purple
          primary: '#7000FF', // Vivid purple
          secondary: '#00C2FF', // Cyan
          accent: '#FF00E5', // Pink/Magenta accent
          surface: '#0F0B1E', // Card background
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        syne: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
}