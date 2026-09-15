/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        arena: {
          bg: "#121214",
          panel: "#18181b",
          card: "#202024",
          border: "#27272a",
          borderSubtle: "#3f3f46",
          accent: "#4ade80",
          indigo: "#6366f1",
        }
      }
    },
  },
  plugins: [],
};
