import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Apple colors
        'apple-blue': 'var(--apple-blue)',
        'apple-blue-dark': 'var(--apple-blue-dark)',
        'apple-green': 'var(--apple-green)',
        'apple-green-dark': 'var(--apple-green-dark)',
        'apple-red': 'var(--apple-red)',
        'apple-red-dark': 'var(--apple-red-dark)',
        'tech-blue': 'var(--tech-blue)',
        'tech-green': 'var(--tech-green)',
        'apple-gray-1': 'var(--apple-gray-1)',
        'apple-gray-2': 'var(--apple-gray-2)',
        'apple-gray-3': 'var(--apple-gray-3)',
        'apple-gray-4': 'var(--apple-gray-4)',
        'apple-gray-5': 'var(--apple-gray-5)',
        'apple-gray-6': 'var(--apple-gray-6)',
        'apple-dark-1': 'var(--apple-dark-1)',
        'apple-dark-2': 'var(--apple-dark-2)',
        'apple-dark-3': 'var(--apple-dark-3)',
        'apple-dark-4': 'var(--apple-dark-4)',
        'apple-dark-5': 'var(--apple-dark-5)',
        'apple-dark-6': 'var(--apple-dark-6)',
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
