/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0fdf4",
          100: "#dcfce7",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          900: "#14532d",
        },
        surface: "#0f172a",
        "surface-2": "#1e293b",
        "surface-3": "#334155",
        accent: "#00e5a0",
        "accent-dim": "#00b37e",
        warn: "#f59e0b",
        danger: "#ef4444",
        info: "#38bdf8",
      },
      fontFamily: {
        display: ["'DM Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(0,229,160,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,160,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "40px 40px",
      },
    },
  },
  plugins: [],
};
