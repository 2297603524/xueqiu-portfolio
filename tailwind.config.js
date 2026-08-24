/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 雪球风格: 红色涨 绿色跌 (中国股市惯例)
        up: "#e11d48", // 涨红
        down: "#16a34a", // 跌绿
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          500: "#64748b",
          700: "#334155",
          900: "#0f172a",
        },
        accent: {
          open: "#2563eb", // 新开仓 - 蓝
          close: "#7c3aed", // 清仓 - 紫
          add: "#dc2626", // 加仓 - 红
          reduce: "#059669", // 减仓 - 绿
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
