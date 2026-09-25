// ============================================================
// src/odoo.js
// Cliente JSON-RPC de solo lectura para Odoo 19
// El panel nunca escribe en Odoo: solo search_read y fields_get
// ============================================================

const DB = import.meta.env.VITE_ODOO_DB || 'prowindows-ltda'

// Credenciales solo en memoria, para re-autenticar si la sesión expira
let _login = null
let _password = null

export const SESSION_EXPIRED_EVENT = 'odoo:session-expired'

async function rpc(path, params, { silent = false, retried = false } = {}) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ jsonrpc: '2.0', method: 'call', id: Date.now(), params })
  })

  let json
  try {
    json = await res.json()
  } catch (_) {
    if (res.status === 502 || res.status === 504) {
      throw new Error('No se pudo conectar a Odoo. Revisa la URL configurada.')
    }
    throw new Error(`Respuesta inesperada del servidor (${res.status})`)
  }

  if (json.error) {
    const errName = json.error.data?.name || ''
    const errMsg = json.error.data?.message || json.error.message || ''

    if (errName.includes('SessionExpired') || errMsg.includes('Session expired')) {
      if (silent) throw new Error('Sin sesión activa en Odoo')
      if (_login && _password && !retried) {
        try {
          await authenticate(_login, _password)
          return rpc(path, params, { retried: true })
        } catch (_) { /* cae al evento de sesión expirada */ }
      }
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      throw new Error('La sesión de Odoo expiró. Ingresa nuevamente.')
    }
    if (errName.includes('AccessDenied') || errMsg.includes('Access Denied')) {
      throw new Error('Acceso denegado. Usuario o contraseña incorrectos.')
    }
    if (errName.includes('AccessError')) {
      throw new Error('Tu usuario de Odoo no tiene permiso para ver estos datos.')
    }
    throw new Error(errMsg || `Error Odoo (${errName || res.status})`)
  }

  return json.result
}

// ── Sesión ──────────────────────────────────────────────────
export async function authenticate(login, password) {
  const result = await rpc('/web/session/authenticate', { db: DB, login, password })
  if (!result?.uid) throw new Error('Usuario o contraseña incorrectos')
  _login = login
  _password = password
  return { uid: result.uid, name: result.name || login, login }
}

export async function getCurrentSession() {
  try {
    const info = await rpc('/web/session/get_session_info', {}, { silent: true })
    if (!info?.uid) return null
    return { uid: info.uid, name: info.name || info.username, login: info.username }
  } catch (_) {
    return null
  }
}

export async function logoutSession() {
  _login = null
  _password = null
  _fieldsCache.clear()
  try { await rpc('/web/session/destroy', {}) } catch (_) { /* expira sola */ }
}

// ── Lectura ─────────────────────────────────────────────────
function callKw(model, method, args, kwargs = {}) {
  return rpc('/web/dataset/call_kw', {
    model, method, args, kwargs: { context: {}, ...kwargs }
  })
}

// Campos existentes por modelo. Los módulos instalados (y Odoo Studio)
// cambian qué campos existen, así que pedimos solo los que hay.
const _fieldsCache = new Map()

export async function getFields(model) {
  if (!_fieldsCache.has(model)) {
    _fieldsCache.set(model, callKw(model, 'fields_get', [], { attributes: ['type', 'string'] })
      .catch(err => { _fieldsCache.delete(model); throw err }))
  }
  return _fieldsCache.get(model)
}

export async function searchRead(model, domain, fields, { limit = 1000, order = 'id desc' } = {}) {
  const available = await getFields(model)
  const validFields = fields.filter(f => f in available)
  const validDomain = domain.filter(term => !Array.isArray(term) || term[0] in available)
  return callKw(model, 'search_read', [validDomain], { fields: validFields, limit, order })
}
