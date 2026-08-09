// tailwind.config.js
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
        'mtis-blue': {
          DEFAULT: '#1a2c5e',
          light: '#2a3d6e',
          dark: '#0f1e3d',
        },
        'mtis-wine': {
          DEFAULT: '#7a2e4a',
          light: '#8f3e5c',
          dark: '#5c1f36',
        },
        'mtis-gold': {
          DEFAULT: '#c4a43e',
          light: '#d4b454',
          dark: '#a0842e',
        },
      },
      backgroundImage: {
        'mtis-gradient': 'linear-gradient(135deg, #1a2c5e 0%, #7a2e4a 100%)',
        'mtis-gradient-reverse': 'linear-gradient(135deg, #7a2e4a 0%, #1a2c5e 100%)',
      },
      boxShadow: {
        'mtis': '0 4px 14px 0 rgba(26, 44, 94, 0.15)',
        'mtis-lg': '0 10px 25px -5px rgba(26, 44, 94, 0.1), 0 8px 10px -6px rgba(122, 46, 74, 0.1)',
      },
    },
  },
  plugins: [],
}