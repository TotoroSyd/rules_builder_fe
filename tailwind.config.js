/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      colors: {
        accent:  '#63b3ed',
        accent2: '#f6ad55',
        danger:  '#fc8181',
        success: '#68d391',
        light: {
          50:  '#ffffff',
          100: '#f5f7fa',
          200: '#e8ecf2',
          300: '#d1d9e6',
          800: '#2d3748',
          850: '#1a202c',
          900: '#171923',
          950: '#0d0f14',
        }
      }
    }
  },
  plugins: []
}