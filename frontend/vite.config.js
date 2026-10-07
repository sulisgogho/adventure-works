import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tambahkan blok konfigurasi ini untuk menjinakkan CSP
  build: {
    sourcemap: false, // Matikan sourcemap mode produksi
  },
  css: {
    devSourcemap: false, // Matikan sourcemap CSS mode dev yang sering pakai eval
  },
})
