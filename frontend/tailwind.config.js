/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#EA5B0C",
          50: "#FEF3ED",
          100: "#FDE4D4",
          200: "#FAC5A5",
          300: "#F7A576",
          400: "#F18344",
          500: "#EA5B0C",
          600: "#C7490A",
          700: "#9C3908",
          800: "#712906",
          900: "#461904",
        },
      },
      borderRadius: {
        brand: "16px",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.06)",
        "card-hover": "0 8px 24px rgba(234, 91, 12, 0.12)",
      },
    },
  },
  plugins: [],
};
