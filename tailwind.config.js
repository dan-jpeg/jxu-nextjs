/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Test Soehne (default via CSS variable)
        sans: ['var(--font-test-soehne)', 'Arial', 'sans-serif'],

        // Helvetica Neue LT Pro (Adobe Font)
        helvetica: ['helvetica-neue-lt-pro', 'sans-serif'],

        // Helvetica Neue Condensed (optional, for bold condensed)
        'helvetica-cond': ['helvetica-neue-lt-pro-cond', 'sans-serif'],
      },
      animation: {
        scroll: 'scroll 60s linear infinite',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [],
};