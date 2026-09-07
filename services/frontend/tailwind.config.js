/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "#0f172a",
        card: "#1e293b",
        border: "#334155",
        primary: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
        },
        warning: "#f59e0b",
        danger: "#ef4444",
        success: "#10b981",
        accent: "#38bdf8",
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-danger': 'glowDanger 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowDanger: {
          '0%': { boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' },
          '100%': { boxShadow: '0 0 25px rgba(239, 68, 68, 0.85)' },
        }
      }
    },
  },
  plugins: [],
};
