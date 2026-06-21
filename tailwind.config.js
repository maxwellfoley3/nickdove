/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.njk",
    "./src/admin/**/*.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['EB Garamond', 'serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('taos/plugin'),
  ],
  safelist: [
    '!duration-[0ms]',
    '!delay-[0ms]',
    'html.js :where([class*="taos:"]:not(.taos-init))',
  ]
} 