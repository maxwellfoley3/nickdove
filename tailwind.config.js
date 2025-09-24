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
  ],
} 