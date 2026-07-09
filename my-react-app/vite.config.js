import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],

    // Fix: Allow @vidstack/react CSS exports under Vite 8 / Rolldown strict resolution
    resolve: {
      conditions: ['browser', 'module', 'import', 'default'],
    },
    
    // Proxy configuration for development
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          secure: false,
          // Only proxy in development
          configure: (proxy, options) => {
            if (env.VITE_ENVIRONMENT === 'production') {
              // Disable proxy in production
              proxy.off('proxyReq')
            }
          }
        }
      }
    },
    
    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      // Optimize for production
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            aws: ['@aws-sdk/client-s3'],
            video: ['hls.js'],
            vidstack: ['@vidstack/react'],
          }
        }
      }
    },
    
    // Define global constants
    define: {
      'import.meta.env.VITE_CLOUDFRONT_DOMAIN': JSON.stringify(env.VITE_CLOUDFRONT_DOMAIN)
    }
  }
})
