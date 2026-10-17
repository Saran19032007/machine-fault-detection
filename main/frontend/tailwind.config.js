/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        status: {
          normal: "#16a34a",
          low: "#eab308",
          moderate: "#f97316",
          high: "#dc2626",
        },
        surface: {
          DEFAULT: "#ffffff",
          dark: "#0f172a",
          panel: "#f8fafc",
          panelDark: "#1e293b",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
