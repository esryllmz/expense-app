/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary": "#004ac6",
        "primary-container": "#2563eb",
        "secondary": "#545f73",
        "surface": "#faf8ff",
        "on-surface": "#191b23",
        "on-surface-variant": "#434655",
        "surface-container-low": "#f3f3fe",
        "surface-container": "#ededf9",
        "surface-container-highest": "#e1e2ed",
        "outline-variant": "#c3c6d7",
        "tertiary": "#943700",
        "tertiary-container": "#bc4800",
        "error": "#ba1a1a",
        "on-secondary-fixed": "#111c2d", // Sidebar rengi
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
        "sidebar-width": "280px",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem", // DESIGN.md: Cards: 1rem
        xl: "1.5rem", // DESIGN.md: Modals: 1.5rem
      }
    },
  },
  plugins: [],
}