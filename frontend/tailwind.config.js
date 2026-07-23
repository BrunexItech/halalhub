/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6edf8',
          100: '#b3ccee',
          200: '#80aae4',
          300: '#4d89d9',
          400: '#1a67cf',
          500: '#0033a1',
          600: '#002c88',
          700: '#00256e',
          800: '#001e55',
          900: '#00163b',
        },
        secondary: {
          50: '#e6f5f7',
          100: '#b3e4e9',
          200: '#80d3db',
          300: '#4dc2cd',
          400: '#1ab1bf',
          500: '#0098a7',
          600: '#00818e',
          700: '#006a75',
          800: '#00545c',
          900: '#003d43',
        },
        dark: '#000423',
        light: '#f8f9fa',
      },
      fontFamily: {
        'arabic': ['Amiri', 'serif'],
        'heading': ['Cormorant Garamond', 'serif'],
        'body': ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
