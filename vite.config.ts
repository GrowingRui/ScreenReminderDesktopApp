import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // 防止 Vite 清屏，以便我们可以看到报错日志
  clearScreen: false,

  // 为 Tauri 开发环境进行配置
  server: {
    port: 5173,
    strictPort: true, // 如果端口被占用直接报错，而不是随机换端口
  },

  // 构建配置，确保兼容性
  build: {
    // 在 Windows 上，Tauri 使用 Chromium，所以支持现代 JS
    target: "es2021",
    // 生产环境不压缩代码，方便调试（可选）
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    // 为调试构建生成源代码映射
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});