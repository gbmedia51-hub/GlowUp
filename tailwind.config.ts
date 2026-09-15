import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FBF6F1",
        ink: "#2A211E",
        "ink-muted": "#6B5E58",
        rose: "#E7B4A8",
        peach: "#F3C9A8",
        accent: "#B45C4D",
        "accent-dark": "#8A3F32",
        line: "#EADFD4",
        card: "#FFFFFF",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(80, 40, 30, 0.15)",
        glow: "0 0 0 6px rgba(231, 180, 168, 0.25)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
