import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // 1. Base path routing for GitHub Pages deployment
  base: '/EcoForge3d/', 

  plugins: [react()],
  
  // 2. Development server & backend api proxy configurations
  server: {
    port: 5173,
    proxy: {
      // Forward /api requests to the Express backend during development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // 3. Testing configuration block
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.js',
  },
});