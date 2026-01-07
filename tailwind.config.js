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
        gold: {
          50: '#fffdf4',
          100: '#fefbe8',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#ffcf54',
          500: '#ffab00',
          600: '#e69500',
          700: '#cc7a00',
          800: '#b36200',
          900: '#804600',
        },
        amber: {
          50: '#fffbf0',
          100: '#fef7e0',
          200: '#fcefc7',
          300: '#f9e2a8',
          400: '#f5d073',
          500: '#fbbf24',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        orange: {
          50: '#fff8f1',
          100: '#feecdc',
          200: '#fcd9bd',
          300: '#fdba8c',
          400: '#ff9947',
          500: '#ff7c1f',
          600: '#f56500',
          700: '#dd5200',
          800: '#c2410c',
          900: '#9a3412',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
