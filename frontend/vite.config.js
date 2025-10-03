import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { securityHeaders } from './vite-plugins/security-headers.js';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProd = mode === 'production';
  
  const config = {
    plugins: [
      react({
        include: "**/*.{jsx,js,ts,tsx}",
        babel: {
          plugins: [],
          babelrc: false,
          configFile: false,
        }
      }),
      securityHeaders() // Add security headers plugin
    ],
    resolve: {
      extensions: ['.mjs', '.js', '.jsx', '.json', '.ts', '.tsx'],
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    esbuild: {
      include: /src\/.*\.[jt]sx?$/,  // include .js, .jsx, .ts, .tsx
      exclude: []
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:5001/',
          changeOrigin: true,
          secure: false,
          ws: true,
          rewrite: (path) => path
        }
      },
      // Allow connections from local network
      host: '0.0.0.0'
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Copy files from public to dist
      copyPublicDir: true,
      // Generate service worker
      assetsDir: 'assets',
      // Minification settings
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd, // Remove console logs in production
          drop_debugger: isProd,
          pure_funcs: isProd ? ['console.log', 'console.info', 'console.debug', 'console.warn'] : []
        },
        format: {
          comments: false // OWASP ZAP: Remove all comments from production builds
        },
        mangle: {
          safari10: true
        }
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['react-bootstrap', '@fortawesome/react-fontawesome'],
            charts: ['recharts', 'chart.js', 'react-chartjs-2'],
            utils: ['axios', 'uuid', 'dompurify']
          },
          // Ensure consistent file names for caching
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            // Don't hash critical files that are referenced externally
            const criticalFiles = ['manifest.json', 'admin.png', '_redirects', '_headers', '.htaccess'];
            const fileName = assetInfo.name || '';

            if (criticalFiles.some(file => fileName.endsWith(file))) {
              // Keep original name without hash for critical files
              return '[name].[ext]';
            }

            // Hash all other assets for cache busting
            return 'assets/[name]-[hash].[ext]';
          }
        }
      },
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000
    },
    optimizeDeps: {
      exclude: []
    }
  };
  
  // Production specific settings
  if (isProd) {
    // Ensure paths to assets work correctly in production
    config.base = '/';

    // Define production environment variables
    config.define = {
      ...config.define,
      // These will be replaced at build time
      '__DEV__': JSON.stringify(false),
      '__PROD__': JSON.stringify(true)
    };

    // Production optimizations
    config.build.rollupOptions.external = [];

    // Disable dev server proxy in production
    delete config.server.proxy;
  } else {
    // Development specific settings
    config.define = {
      ...config.define,
      '__DEV__': JSON.stringify(true),
      '__PROD__': JSON.stringify(false)
    };
  }
  
  return config;
});



