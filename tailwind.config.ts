import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      // Responsive padding: smaller on mobile for more content space
      padding: {
        DEFAULT: '1rem', // 16px on mobile
        sm: '1.5rem', // 24px on small tablets
        md: '2rem', // 32px on tablets+
        lg: '2rem',
        xl: '2rem',
        '2xl': '2rem',
      },
      // Explicit breakpoints for documentation and consistency
      screens: {
        sm: '640px', // Mobile landscape / small tablets
        md: '768px', // Tablets
        lg: '1024px', // Laptops
        xl: '1280px', // Desktops
        '2xl': '1400px', // Large screens (custom)
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        srs: {
          new: '#3b82f6',
          learning: '#eab308',
          review: '#22c55e',
          relearning: '#ef4444',
          guru: '#8b5cf6',
        },
        tone: {
          1: '#ef4444',
          2: '#f59e0b',
          3: '#22c55e',
          4: '#3b82f6',
          5: '#6b7280',
        },
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        flip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-correct': {
          '0%, 100%': { backgroundColor: 'rgb(34, 197, 94, 0.2)' },
          '50%': { backgroundColor: 'rgb(34, 197, 94, 0.4)' },
        },
        'pulse-incorrect': {
          '0%, 100%': { backgroundColor: 'rgb(239, 68, 68, 0.2)' },
          '50%': { backgroundColor: 'rgb(239, 68, 68, 0.4)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        flip: 'flip 0.6s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-correct': 'pulse-correct 0.5s ease-in-out',
        'pulse-incorrect': 'pulse-incorrect 0.5s ease-in-out',
      },
      fontSize: {
        // Character display sizes - responsive from very small phones to desktop
        character: ['6rem', { lineHeight: '1', fontWeight: '400' }],
        'character-sm': ['4rem', { lineHeight: '1', fontWeight: '400' }],
        'character-xs': ['3rem', { lineHeight: '1', fontWeight: '400' }], // For very small phones (<375px)
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
