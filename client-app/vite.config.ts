import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Excluir el service worker del hot module replacement
    hmr: {
      protocol: 'ws',
    },
  },
})
