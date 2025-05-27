import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    resolve: {
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.[jt]sx?$/,  // include .js, .jsx, .ts, .tsx
      exclude: []
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/dashboard/data': {
          target: 'http://localhost:5001/api',
          changeOrigin: true,
          secure: false
        }
      },
      // Allow connections from local network
      host: '0.0.0.0'
    },
    build: {
      outDir: 'dist',
      sourcemap: process.env.NODE_ENV !== 'production',
      // Copy files from public to dist
      copyPublicDir: true,
      // Generate service worker
      assetsDir: 'assets',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts']
          }
        }
      }
    }
  };
  
  // Workaround for 404 issues in production
  if (command === 'build') {
    // Ensure paths to assets work correctly in production
    config.base = './';
  }
  
  return config;
});



