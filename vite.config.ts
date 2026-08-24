import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 部署在 https://<user>.github.io/xueqiu-portfolio/ 子路径下，默认用子路径 base；
  // 本地 dev / CloudStudio 部署用根路径：npm run build:root（--base=/）
  base: '/xueqiu-portfolio/',
  plugins: [react()],
})
