/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Desperto brand color palette
        primary: {
          50: '#f8f6f0',
          100: '#f0ebe0',
          200: '#e8ddc4',
          300: '#dcc89a',
          400: '#d4b876',
          500: '#725c1a',
          600: '#5d4a15',
          700: '#4a3b11',
          800: '#3d310e',
          900: '#32280c',
        },
        secondary: {
          50: '#0a0a0a',
          100: '#1a1a1a',
          200: '#2a2a2a',
          300: '#3a3a3a',
          400: '#4a4a4a',
          500: '#030303',
          600: '#020202',
          700: '#010101',
          800: '#000000',
          900: '#000000',
        },
        accent: {
          50: '#fffdf0',
          100: '#fffae0',
          200: '#fff4c2',
          300: '#ffeb99',
          400: '#ffdf66',
          500: '#e2bc33',
          600: '#cc9f1a',
          700: '#a67f15',
          800: '#856611',
          900: '#6b520e',
        },
        neutral: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#eeeeec',
          300: '#e6e6e3',
          400: '#d1d1cc',
          500: '#7d7c76',
          600: '#6b6a65',
          700: '#565651',
          800: '#464642',
          900: '#3a3a37',
        },
        // Additional Desperto colors
        desperto: {
          gold: '#725c1a',
          yellow: '#e2bc33',
          cream: '#e3dfd3',
          dark: '#030303',
          gray: '#7d7c76',
        },
        wellness: {
          calm: '#f8f6f0',
          growth: '#fffdf0',
          balance: '#fafaf9',
          trust: '#f5f5f4',
        }
      }
    },
  },
  plugins: [],
};
