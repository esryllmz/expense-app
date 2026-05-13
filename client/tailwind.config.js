/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#004ac6",
        "primary-container": "#2563eb",
        surface: "#faf8ff",
        "surface-container": "#ededf9",
        "surface-container-low": "#f3f3fe",
        secondary: "#545f73",
        "on-surface": "#191b23",
        "on-surface-variant": "#434655",
        outline: "#737686",
        "outline-variant": "#c3c6d7",
        tertiary: "#943700",
        "on-secondary-fixed": "#1e293b", // Sidebar rengi
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "sidebar-width": "280px",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [
    require("tw-animate-css") // Yanlış yazılmış olabilir
  ],
};