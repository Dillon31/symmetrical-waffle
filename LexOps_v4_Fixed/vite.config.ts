import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Raise chunk-size warning threshold (some pages are legitimately large)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Code-split by page so initial bundle stays small
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('react-router')) return 'router'
            if (id.includes('lucide')) return 'icons'
            return 'vendor'
          }
        },
      },
    },
  },
})
