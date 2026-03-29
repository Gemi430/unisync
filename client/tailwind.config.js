/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9', // Primary brand color
          600: '#0284c7',
          900: '#0c4a6e',
        },
        accent: {
          500: '#10b981', // Natural Stream color
          600: '#059669',
        },
        social: {
          500: '#f43f5e', // Social Stream color
          600: '#e11d48',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
