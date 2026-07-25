import type { Config } from "tailwindcss";

/**
 * Brand + semantic tokens are declared as CSS variables in
 * `src/app/globals.css` (space-separated RGB channels) so that Tailwind's
 * opacity modifiers (e.g. `bg-teal/10`) work everywhere and light/dark mode
 * can swap the same token names.
 */
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
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
        // Semantic (theme-aware) tokens
        background: rgb("--background"),
        foreground: rgb("--foreground"),
        card: {
          DEFAULT: rgb("--card"),
          foreground: rgb("--card-foreground"),
        },
        muted: {
          DEFAULT: rgb("--muted"),
          foreground: rgb("--muted-foreground"),
        },
        border: rgb("--border"),
        input: rgb("--input"),
        ring: rgb("--ring"),

        // Brand tokens
        primary: {
          DEFAULT: rgb("--primary"),
          mid: rgb("--primary-mid"),
          foreground: rgb("--primary-foreground"),
        },
        teal: {
          DEFAULT: rgb("--teal"),
          foreground: rgb("--teal-foreground"),
        },
        gold: rgb("--gold"),
        success: rgb("--success"),
        warning: rgb("--warning"),
        error: rgb("--error"),
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(11 42 74 / 0.04), 0 8px 24px -12px rgb(11 42 74 / 0.18)",
        lift: "0 12px 40px -12px rgb(11 42 74 / 0.28)",
        "teal-glow": "0 10px 30px -10px rgb(18 179 166 / 0.45)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s ease-out both",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
