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
        // Soft-depth palette: bg is a subtle tint distinct from surface (card)
        // white, so cards visibly lift off the page instead of blending into
        // it (the old bg.light === surface.light meant zero depth in light mode).
        bg: {
          light: '#F7F8FA',
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
          light: '#64748b',
          dark: '#94a3b8',
        },
        // Brand primary (already the de-facto accent throughout the app —
        // formalized here so it reads as a system, not a scattered choice).
        // Neutral (near-black in light mode / near-white in dark mode) —
        // replaces the previous indigo brand accent.
        primary: {
          light: '#171717',
          dark: '#e5e5e5',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        // Soft, layered elevation — replaces ad-hoc one-off shadow strings.
        'soft-sm': '0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 1px 0 rgba(15, 23, 42, 0.03)',
        'soft-md': '0 4px 10px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        'soft-lg': '0 12px 24px -8px rgba(15, 23, 42, 0.10), 0 4px 10px -4px rgba(15, 23, 42, 0.06)',
        'soft-dark-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.20)',
        'soft-dark-md': '0 4px 12px -2px rgba(0, 0, 0, 0.35)',
        'soft-dark-lg': '0 16px 32px -8px rgba(0, 0, 0, 0.45)',
      },
      transitionTimingFunction: {
        'soft-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      }
    },
  },
  plugins: [],
}
