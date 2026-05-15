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
        // Neutral clean palette (Notion style)
        bg: {
          light: '#ffffff',
          dark: '#191919',
        },
        surface: {
          light: '#f7f7f5',
          dark: '#202020',
        },
        border: {
          light: '#e6e6e6',
          dark: '#333333',
        },
        text: {
          light: '#37352f', // Notion default text color
          dark: '#ffffff',
        },
        textMuted: {
          light: '#9a9a97',
          dark: '#9b9b9b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
