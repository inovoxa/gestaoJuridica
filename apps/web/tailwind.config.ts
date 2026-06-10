import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta institucional jurídica (azul-marinho/dourado), espelhando o dashboard Odoo.
        brand: {
          DEFAULT: "#0B3C5D",
          dark: "#082A41",
          gold: "#C9A227",
        },
      },
    },
  },
  plugins: [],
};

export default config;
