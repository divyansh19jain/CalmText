/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#121212",
          surface: "#1E1E1E",
          accent: "#2D2D2D",
        },
        brand: {
          primary: "#6366F1",
          secondary: "#10B981",
          accent: "#F59E0B",
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
