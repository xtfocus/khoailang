import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    watch: {
      usePolling: true,
    },
    proxy: {
      '/auth': {
        target: 'http://backend:8000', // Updated to use Docker service name
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth/, '/auth'),
      },
    },
  },
});
