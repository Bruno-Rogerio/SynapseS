import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // ou a porta que você preferir
    open: true, // abre o navegador automaticamente
  },
  build: {
    outDir: 'dist',
    minify: 'terser',
    sourcemap: true,
  },
})
