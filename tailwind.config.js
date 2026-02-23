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
        dark: {
          50:  '#e8eaf0',
          100: '#7a8299',
          200: '#4a5270',
          800: '#252a3a',
          850: '#1e2230',
          900: '#161921',
          950: '#0d0f14',
        }
      }
    }
  },
  plugins: []
}
