import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#6D5CFF",
          hover: "#5B4AE8",
          soft: "#F4F1FF",
          ink: "#3C2BC4",
        },
        ink: "#0F172A",
        canvas: "#F5F6FA",
      },
      boxShadow: {
        card: "0 8px 30px rgba(15, 23, 42, 0.05)",
        pop: "0 18px 60px rgba(15, 23, 42, 0.16)",
        glow: "0 8px 22px rgba(109, 92, 255, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
