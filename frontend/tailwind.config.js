// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plasma: {
          primary: 'var(--color-primary, #1e40af)',
          secondary: 'var(--color-secondary, #dc2626)',
          success: 'var(--color-success, #16a34a)',
          warning: 'var(--color-warning, #d97706)',
        },
        theme: {
          card: 'var(--color-card, #ffffff)',
          text: 'var(--color-text, #1f2937)',
          'text-muted': 'var(--color-text-muted, #6b7280)',
        }
      },
      backgroundColor: {
        'theme-card': 'var(--color-card, #ffffff)',
        'theme-primary': 'var(--color-primary, #1e40af)',
      },
      textColor: {
        'theme': 'var(--color-text, #1f2937)',
        'theme-muted': 'var(--color-text-muted, #6b7280)',
      },
      gradientColorStops: {
        'theme-bg': 'var(--bg-gradient, linear-gradient(to bottom right, #f0f9ff, #e0f2fe))',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}