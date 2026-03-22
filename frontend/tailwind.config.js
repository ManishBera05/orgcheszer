/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Chess dark + green theme
        board: {
          dark: "#1a1a1a", // main background
          card: "#242424", // card background
          border: "#2d2d2d", // borders
        },
        chess: {
          green: "#4a7c59", // classic chess board green
          greenLight: "#6aad7a", // hover/accent
          greenDark: "#2d5a3d", // darker variant
          gold: "#c9a84c", // highlights/badges
          cream: "#f0d9b5", // light square color
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
