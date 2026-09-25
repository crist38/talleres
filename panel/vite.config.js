import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const odooTarget = env.VITE_ODOO_URL || 'http://localhost:8069'
  console.log(`[vite] Proxy Odoo → ${odooTarget}`)

  return {
    plugins: [react()],
    // Durante desarrollo, proxy a Odoo para evitar CORS
    server: {
      proxy: {
        '/web': { target: odooTarget, changeOrigin: true, secure: false }
      }
    }
  }
})
