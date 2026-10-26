/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // VS Code / Cloud IDE dark theme with orange
        bg: {
          primary: "#1e1e1e",
          secondary: "#252526",
          tertiary: "#2d2d2d",
          hover: "#313131",
          input: "#3c3c3c",
        },
        border: {
          DEFAULT: "#3c3c3c",
          soft: "#2a2a2a",
          accent: "#f97316",
        },
        accent: {
          orange: "#f97316",
          amber: "#fb923c",
          orangeDim: "rgba(249,115,22,0.12)",
          orangeBorder: "rgba(249,115,22,0.3)",
        },
        text: {
          primary: "#d4d4d4",
          bright: "#ffffff",
          dim: "#858585",
          muted: "#6a6a6a",
        },
        status: {
          success: "#4ade80",
          warn: "#fbbf24",
          error: "#f87171",
          info: "#60a5fa",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Cascadia Code", "Fira Code", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
