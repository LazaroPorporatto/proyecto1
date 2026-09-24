import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    css: true,
  },
  server: {
    host: true, // Permite que el servidor sea accesible desde fuera del contenedor
    port: 5173, // Puerto que estás exponiendo en el docker-compose
    watch: {
      usePolling: true, // Necesario para que Vite detecte cambios dentro del contenedor
    },
  },
})
