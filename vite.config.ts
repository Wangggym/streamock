import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/frontend',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3002',  // 你的 Bun 服务器地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  }
}); 