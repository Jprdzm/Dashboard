/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Glassmorphism / Linear-style palette
        bg: {
          light: '#ffffff',
          dark: '#0B0F19',
        },
        surface: {
          light: '#ffffff',
          dark: 'rgba(255, 255, 255, 0.04)',
        },
        border: {
          light: '#e2e8f0',
          dark: 'rgba(255, 255, 255, 0.06)',
        },
        text: {
          light: '#1e293b',
          dark: '#e2e8f0',
        },
        textMuted: {
          light: '#94a3b8',
          dark: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
