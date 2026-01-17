/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,md,njk,liquid}",
    "./src/_includes/**/*.{html,js,md,njk,liquid}",
    "./src/_layouts/**/*.{html,js,md,njk,liquid}",
    "./src/_data/**/*.{js,json}"
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