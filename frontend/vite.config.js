import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/EcoForge3d/',
  build: {
    outDir: 'docs', // Changes output from 'dist' to 'docs'
  },
});