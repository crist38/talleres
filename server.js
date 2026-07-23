// ============================================================
// server.js – Express Proxy para FactoryFloor
// Sirve el frontend compilado y reenvía /web/* a Odoo 19
// Sin modificar Nginx ni odoo.conf
// ============================================================
import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// --- Cargar .env manualmente (sin depender de dotenv) --------
try {
  const env = readFileSync(join(__dirname, '.env'), 'utf8')
  env.split('\n').forEach(line => {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim()
  })
} catch (_) { /* .env opcional en producción */ }

const ODOO_URL  = process.env.ODOO_URL  || 'http://localhost:8069'
const PORT      = process.env.PORT      || 3000
const DIST_DIR  = join(__dirname, 'dist')

const app = express()

// 1. Proxy: cualquier ruta /web/* → Odoo (mismo origen para el browser)
app.use(
  '/web',
  createProxyMiddleware({
    target: ODOO_URL,
    changeOrigin: true,
    secure: false,
    on: {
      error: (err, req, res) => {
        console.error('[proxy] Error conectando a Odoo:', err.message)
        res.status(502).json({ error: 'No se pudo conectar a Odoo', detail: err.message })
      }
    }
  })
)

// 2. Archivos estáticos del frontend compilado
app.use(express.static(DIST_DIR))

// 3. SPA fallback: todas las rutas devuelven index.html
app.get('*', (_req, res) => {
  res.sendFile(join(DIST_DIR, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`✅ FactoryFloor corriendo en http://localhost:${PORT}`)
  console.log(`🔗 Proxy Odoo → ${ODOO_URL}`)
})
