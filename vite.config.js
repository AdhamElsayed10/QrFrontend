<<<<<<< HEAD
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5051',
        changeOrigin: true,
        secure: false,
      },
      '/pdf': {
        target: 'http://localhost:5051',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
=======
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/pdf': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
>>>>>>> 1a2fb271cb5e7348ed7c7d2499217915b7e2ea01
