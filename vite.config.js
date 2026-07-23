import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const odooTarget = env.VITE_ODOO_URL || 'http://localhost:8069'
  console.log(`[vite] Proxy Odoo → ${odooTarget}`)

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Talleres Prowindows',
        short_name: 'Talleres Prowindows',
        description: 'Interfaz de operario para Fabricación Odoo 19',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'fullscreen',
        orientation: 'landscape',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: []
      }
    })
  ],
    // Durante desarrollo, proxy a Odoo para evitar CORS
    server: {
      proxy: {
        '/web': {
          target: odooTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => console.error('[proxy] Error Odoo:', err.message))
            proxy.on('proxyRes', (res, req) => {
              if (res.statusCode >= 400) console.warn(`[proxy] ${res.statusCode} ${req.url}`)
            })
          }
        }
      }
    }
  }
})
