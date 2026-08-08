/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          900: '#032A24',
          800: '#0B342B',
          700: '#134F40',
          600: '#1A6A56',
          500: '#22856C',
        },
        gold: {
          700: '#C9A44B',
          500: '#E1C16B',
        },
        white: '#FFFFFF',
      },
    },
  },
  plugins: [],
}
