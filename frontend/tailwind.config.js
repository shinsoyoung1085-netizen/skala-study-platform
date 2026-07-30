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
      keyframes: {
        // 슬라임이 날아가는 동안 꿀렁이는 효과
        squish: {
          "0%, 100%": { transform: "scale(1, 1)" },
          "50%": { transform: "scale(0.8, 1.2)" },
        },
        // 그래프에 슬라임이 부딪혔을 때 "띵" 하고 튀는 효과
        bump: {
          "0%": { transform: "scale(1)" },
          "35%": { transform: "scale(1.06)" },
          "60%": { transform: "scale(0.98)" },
          "100%": { transform: "scale(1)" },
        },
        // 부딪힌 자리에서 "+00:15" 같은 라벨이 위로 떠오르며 사라지는 효과
        "float-fade": {
          "0%": { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-28px)", opacity: "0" },
        },
      },
      animation: {
        squish: "squish 0.35s ease-in-out infinite",
        bump: "bump 0.45s ease-out",
        "float-fade": "float-fade 0.9s ease-out forwards",
      },
    },
  },
  plugins: [],
};
