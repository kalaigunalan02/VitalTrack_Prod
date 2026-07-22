/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0E1A",
        surface: "#131826",
        surface2: "#1B2338",
        border: "rgba(255,255,255,0.08)",
        muted: "#8B94A8",
        brand: {
          DEFAULT: "#34D399",
          light: "#4ADE80",
        },
        danger: "#F87171",
        warn: "#FBBF24",
        info: "#60A5FA",
        meal: "#FB923C",
        sleep: "#818CF8",
        symptom: "#A78BFA",
        water: "#2DD4BF",
      },
      borderRadius: {
        xl2: "16px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
}
