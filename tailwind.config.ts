import type { Config } from "tailwindcss";

/**
 * Premium gold-and-ivory Locrativ identity. Tokens are declared as CSS
 * variables (space-separated RGB channels) in `src/app/globals.css` so
 * Tailwind opacity modifiers work (e.g. `border-gold/25`). Light-only —
 * there is no dark mode.
 */
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.25rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1200px",
      },
    },
    extend: {
      colors: {
        background: rgb("--ivory"),
        foreground: rgb("--charcoal"),
        ivory: rgb("--ivory"),
        card: {
          DEFAULT: rgb("--card"),
          foreground: rgb("--charcoal"),
        },
        charcoal: {
          DEFAULT: rgb("--charcoal"),
          dark: rgb("--charcoal-dark"),
        },
        gold: {
          DEFAULT: rgb("--gold"),
          soft: rgb("--gold-soft"),
        },
        muted: {
          DEFAULT: rgb("--ivory-deep"),
          foreground: rgb("--muted"),
        },
        // Soft gold hairline used for cards + dividers.
        border: "rgb(var(--gold) / 0.22)",
        input: "rgb(var(--gold) / 0.30)",
        ring: rgb("--gold"),
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      boxShadow: {
        card: "0 1px 2px rgb(29 29 31 / 0.04), 0 10px 30px -18px rgb(29 29 31 / 0.20)",
        lift: "0 24px 60px -28px rgb(29 29 31 / 0.30)",
        paper:
          "0 2px 4px rgb(29 29 31 / 0.06), 0 30px 60px -24px rgb(29 29 31 / 0.28)",
        gold: "0 12px 28px -14px rgb(198 138 30 / 0.55)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0", opacity: "0" },
          to: { height: "var(--radix-accordion-content-height)", opacity: "1" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)", opacity: "1" },
          to: { height: "0", opacity: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.24s ease-out",
        "accordion-up": "accordion-up 0.24s ease-out",
        "fade-up": "fade-up 0.6s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
