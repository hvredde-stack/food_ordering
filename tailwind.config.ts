import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
      },
      fontFamily: { sans: ["system-ui", "sans-serif"] },
      borderRadius: { xl: "0.875rem" },
    },
  },
  plugins: [],
};

export default config;
