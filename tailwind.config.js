/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          lighter: "hsl(0,0%,99%)",
          light: "hsl(0,0%,90%)",
          main: "hsl(0,0%,75%)",
          dark: "hsl(0,0%,50%)",
        },
      },
      height: {
        nav: "80px",
        body: "calc((100vh - 80px)*3/4)",
      },
      fontFamily: {
        Quicksand: "Quicksand",
      },
    },
  },
  plugins: [],
};
