/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // ✅ correct glob for Tailwind to scan React files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};