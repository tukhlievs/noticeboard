import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // iOS-style токены через CSS-переменные.
        // Светлая/тёмная тема переключаются через theme params от Telegram WebApp.
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        border: "hsl(var(--border))",
        // iOS systemBlue и systemRed для акцентов
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
      },
      borderRadius: {
        // iOS любит 12-16px скругления на карточках
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      fontFamily: {
        // Inter подключается через next/font в layout.tsx
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        // Oswald строго для бренда Noticeboard
        brand: ["var(--font-oswald)", "Impact", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
