/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9ecff',
          500: '#2f7ff7',
          600: '#1f66d1',
          700: '#184fa3',
        },
        slateBlue: '#3f4f75',
        mint: '#75d5b1',
        sand: '#f4efe8',
      },
      boxShadow: {
        glass: '0 10px 35px rgba(23, 42, 79, 0.15)',
      },
      backgroundImage: {
        hero: 'radial-gradient(circle at 20% 20%, rgba(47,127,247,0.18), transparent 45%), radial-gradient(circle at 80% 0%, rgba(117,213,177,0.2), transparent 40%), linear-gradient(140deg, #f8fbff 0%, #eef3fa 60%, #f9f5ef 100%)',
      },
    },
  },
  plugins: [],
};

