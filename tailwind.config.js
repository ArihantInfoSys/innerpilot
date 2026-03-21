/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#111118",
        },
        glass: {
          bg: "rgba(255, 255, 255, 0.05)",
          border: "rgba(255, 255, 255, 0.10)",
        },
      },
      backdropBlur: {
        glass: "16px",
      },
    },
  },
  plugins: [],
};
