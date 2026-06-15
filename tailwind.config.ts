import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Verde de marca SELECT
        brand: {
          DEFAULT: "#1FE07A",
          dark: "#11A85A",
          light: "#5CF2A3",
          glow: "#1FE07A",
        },
        ink: "#05070a", // negro de fondo
      },
      boxShadow: {
        brand: "0 8px 30px -6px rgba(31, 224, 122, 0.45)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
