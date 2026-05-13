/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Funnel Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          coral: '#FD4E59',
          orange: '#FFAB28',
          background: '#FFFDFF',
          card: '#FDF8F4',
          cream: '#FFF0DC',
          ink: '#161916',
          muted: '#494949',
          gray: '#6D7069',
        },
      },
      boxShadow: {
        soft: '0 18px 55px rgba(22, 25, 22, 0.08)',
        lift: '0 18px 35px rgba(253, 78, 89, 0.16)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
      },
    },
  },
  plugins: [],
}
