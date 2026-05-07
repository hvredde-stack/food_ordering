import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:        "rgb(var(--bg) / <alpha-value>)",
        "bg-alt":  "rgb(var(--bg-alt) / <alpha-value>)",
        "bg-warm": "rgb(var(--bg-warm) / <alpha-value>)",
        fg:        "rgb(var(--fg) / <alpha-value>)",
        muted:     "rgb(var(--muted) / <alpha-value>)",
        card:      "rgb(var(--card) / <alpha-value>)",
        border:    "rgb(var(--border) / <alpha-value>)",
        accent:    "rgb(var(--accent) / <alpha-value>)",
        "accent-2": "rgb(var(--accent-2) / <alpha-value>)",
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.2, 0.8, 0.2, 1)",
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
