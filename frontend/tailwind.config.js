/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ["class", '[class~="dark"]'],

  theme: {
    extend: {
      colors: {
        text: "var(--color-text)",
        text2: "var(--color-text2)",
        bg: "var(--color-bg)",
        bg2: "var(--color-bg2)",
        primary: "var(--color-primary)",
        primary2: "var(--color-primary2)",
        secondary: "var(--color-secondary)",
        hover: "var(--color-hover)",
        tableCreate: "var(--color-tableCreate)",
        tableEdit: "var(--color-tableEdit)",
        tableDelete: "var(--color-tableDelete)",
        tableBorder: "var(--color-tableBorder)",
      },
    },
  },

  plugins: [
    ({ addUtilities }) => {
      addUtilities({
        ".cursor-default": { cursor: "default" },
        ".cursor-pointer": { cursor: "pointer" },
        ".select-none": { userSelect: "none" },
        ".select-text": { userSelect: "text" },
      });
    },
  ],
};
