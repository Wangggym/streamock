import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src/frontend',
  server: {
    port: 3000,
    cors: true,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',  // 改为后端服务器地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    hmr: {
      clientPort: 3000,
      port: 3000
    },
    watch: {
      usePolling: true,
    },
    fs: {
      strict: false,
      allow: ['..']
    }
  },
  build: {
    outDir: '../../dist/frontend',
    emptyOutDir: true
  },
  publicDir: resolve(__dirname, 'public'),
  cacheDir: resolve(__dirname, 'node_modules/.vite'),
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  }
}); 