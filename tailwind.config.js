/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 20px 50px rgba(61, 43, 31, 0.08)',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        blush: {
          50: '#fff8f7',
          100: '#fdeceb',
          200: '#f8d8d6',
          500: '#d79a95',
          700: '#9d6863',
        },
        sand: '#f8f4ee',
      },
    },
  },
  plugins: [],
}
