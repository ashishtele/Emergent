import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#16130E",
        paper: "#FAF7F1",
        accent: "#E8500A",
        moss: "#22301F",
        coal: "#14100B",
        soot: "#221C14",
      },
    },
  },
  plugins: [],
};
export default config;
