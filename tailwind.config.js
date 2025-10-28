/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#fff8f0',
        cyan: {
          DEFAULT: '#00b8e6',
          dark: '#009dc7',
        },
        cancel: {
          bg: '#ffb3b3',
          text: '#990000',
          hover: '#ff9999',
        },
      },
      fontFamily: {
        sans: ['Alexandria', 'sans-serif'],
        display: ['Bakbak One', 'cursive'],
      },
    },
  },
  plugins: [],
};
