import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 部署在 https://<user>.github.io/xueqiu-portfolio/ 子路径下，默认用子路径 base；
  // 本地 dev / CloudStudio 部署用根路径：npm run build:root（--base=/）
  base: '/xueqiu-portfolio/',
  plugins: [react()],
  build: {
    target: 'es2020',
    // 单页应用只有一份样式，拆成多个 css 文件反而多一次请求
    cssCodeSplit: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // React 运行时单独分包：业务代码改动时这一块仍可命中浏览器缓存
        manualChunks(id: string) {
          if (id.includes('node_modules/react')) return 'react'
        },
      },
    },
  },
})
