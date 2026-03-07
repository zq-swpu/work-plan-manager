import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  optimizeDeps: {
    include: ['sql.js', 'mammoth']
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      include: [/sql.js/, /mammoth/, /node_modules/]
    }
  },
  server: {
    port: 1420,
    strictPort: true
  },
  clearScreen: false
})
