/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
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
