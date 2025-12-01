import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3010,
    host: true
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: false,
    copyPublicDir: true,
    assetsDir: 'assets',
    cssCodeSplit: false, // Ensure CSS is in a single file
    rollupOptions: {
      output: {
        manualChunks: undefined,
        // Use default Vite naming with hash for cache busting
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
      }
    }
  }
})
