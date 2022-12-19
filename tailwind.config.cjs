/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./src/**/*.{css,js,ts,jsx,tsx}",
    "./popup/**/*.{css,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        crisp: "inset 0px -1px 0px rgb(207 217 222)",
      },
    },
  },
  plugins: [],
}
