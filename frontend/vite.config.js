import { defineConfig } from 'vite'
import dns from 'node:dns'

dns.setDefaultResultOrder('ipv4first')

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://web:80',
        changeOrigin: true,
        headers: {
          Accept: 'application/json',
        }
      },
      '/sanctum': {
        target: 'http://web:80',
        changeOrigin: true,
      },
    },
    watch: {
      usePolling: true,
    },
  },
})
