/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'gradient': 'gradient 2s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%': { 'background-position': '0% 50%' },
          '100%': { 'background-position': '300% 50%' },
        },
      },
      colors: {
        brand: {
          blue: '#1E3C96',
          green: '#008242',
          yellow: '#FFB81C',
          red: '#E31837',
          black: '#000000',
          white: '#FFFFFF',
        },
        primary: {
          50: '#F5F7FC',
          500: '#1E3C96', // Brand blue
          600: '#182D71', // Darker
          700: '#121F4C', // Even darker
        },
      },
      fontFamily: {
        'rethink': ['RethinkSans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
