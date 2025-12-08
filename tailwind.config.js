/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
const { heroui } = require("@heroui/react");
export default {
  content: ["./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'quint': ['Quintessential', 'sans-serif'],
        'kanit': ['Kanit', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        'lato': ['Lato', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'custom-background': "url('../assets/background.png')",
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}

