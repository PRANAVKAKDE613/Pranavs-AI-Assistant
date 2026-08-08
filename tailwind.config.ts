import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bgLight: "#f7f5f0",
        surfaceLight: "#ffffff",
        surfaceSoftLight: "#efebe2",
        inkLight: "#151514",
        mutedLight: "#6f6a61",
        lineLight: "#ded8cc",
        accentLight: "#176b63",
        accentDarkTeal: "#0f4c46",
        coralLight: "#c95f43",

        bgDark: "#141412",
        surfaceDark: "#1d1c19",
        surfaceSoftDark: "#26231e",
        inkDark: "#f5f1e8",
        mutedDark: "#b4aa9a",
        lineDark: "#3b352d",
        accentDark: "#66c6b7",
        coralDark: "#f09a78",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
