/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          light: '#60A5FA',
          dark: '#1D4ED8',
        },
        accent: {
          DEFAULT: '#06B6D4',
          light: '#67E8F9',
          dark: '#0E7490',
        },
        luxuryBg: '#0B1528',
        luxurySurface: '#101B30',
        luxuryCard: '#14233F',
        luxuryText: '#F8FAFC',
        luxuryMuted: '#8EA0BD',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        'luxury': '24px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'Poppins', 'sans-serif'],
        syne: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        outfit: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        grotesk: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
