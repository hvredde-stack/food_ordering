import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:       "rgb(var(--bg) / <alpha-value>)",
        "bg-alt": "rgb(var(--bg-alt) / <alpha-value>)",
        fg:       "rgb(var(--fg) / <alpha-value>)",
        muted:    "rgb(var(--muted) / <alpha-value>)",
        card:     "rgb(var(--card) / <alpha-value>)",
        border:   "rgb(var(--border) / <alpha-value>)",
        accent:   "rgb(var(--accent) / <alpha-value>)",
        "accent-2": "rgb(var(--accent-2) / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        editorial: "0.12em",
      },
      borderRadius: { xl: "0.875rem" },
    },
  },
  plugins: [],
};

export default config;
