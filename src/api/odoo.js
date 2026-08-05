// ============================================================
// src/api/odoo.js
// Wrapper JSON-RPC para Odoo 19
// Todos los métodos retornan Promises y manejan sesión expirada
// ============================================================

const BASE_URL = '' // vacío = mismo origen (proxy maneja /web/*)

let _uid = null
let _db = import.meta.env.VITE_ODOO_DB || ''
let _user = import.meta.env.VITE_ODOO_USER || ''
let _password = import.meta.env.VITE_ODOO_PASSWORD || ''

// ── Primitiva JSON-RPC ──────────────────────────────────────
async function rpc(path, params) {
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    id: Math.floor(Math.random() * 1e9),
    params
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  })

  // Intentar leer el cuerpo aunque sea un error HTTP (Odoo suele enviar JSON útil incluso en 500)
  let json
  try {
    json = await res.json()
  } catch (_) {
    // Respuesta no-JSON (ej. página de error de Nginx/Odoo)
    if (!res.ok) {
      const hint = res.status === 502 || res.status === 504
        ? 'No se pudo conectar a Odoo. Verifica que el servidor esté activo y la URL en .env sea correcta.'
        : `HTTP ${res.status}: ${res.statusText}`
      throw new Error(hint)
    }
    throw new Error(`Respuesta inesperada del servidor (${res.status})`)
  }

  if (json.error) {
    const errName = json.error.data?.name || ''
    const errMsg  = json.error.data?.message || json.error.message || ''

    // Sesión expirada → re-autenticar automáticamente
    if (errName === 'odoo.exceptions.SessionExpiredException') {
      await authenticate()
      return rpc(path, params) // retry
    }

    // Errores comunes con mensajes claros en español
    if (errName.includes('AccessDenied') || errMsg.includes('Access Denied')) {
      throw new Error('Acceso denegado. Usuario o contraseña incorrectos.')
    }
    if (errMsg.includes('database') && errMsg.toLowerCase().includes('does not exist')) {
      throw new Error(`Base de datos no encontrada. Verifica el nombre exacto en Odoo.`)
    }

    throw new Error(errMsg || `Error Odoo (${errName || res.status})`)
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }

  return json.result
}

// ── Autenticación ───────────────────────────────────────────
export async function authenticate(db, user, password) {
  if (db) { _db = db; _user = user; _password = password }
  const result = await rpc('/web/session/authenticate', {
    db: _db,
    login: _user,
    password: _password
  })
  if (!result?.uid) throw new Error('Credenciales inválidas o base de datos incorrecta')
  _uid = result.uid
  return result
}

// Asegurar autenticación del sistema (para cargar empleados en Kiosco)
export async function ensureAuthenticated() {
  if (_uid) return _uid
  const result = await authenticate()
  return result.uid
}

// Lista estática de respaldo en caso de que las reglas de seguridad de Odoo impidan a api_operarios leer hr.employee
const FALLBACK_EMPLOYEES = [
  { id: 1, name: 'Carlos Contreras R.', job_title: 'Gerente General', department_id: [1, 'ADMINISTRATION'] },
  { id: 2, name: 'Cristian Pereira', job_title: 'Compras', department_id: [2, 'ADMINISTRATION'] },
  { id: 3, name: 'Cristian Tabilo', job_title: 'Jefe de Taller', department_id: [3, 'ADMINISTRATION / TALLER DE PVC'] },
  { id: 4, name: 'Daniel Pacheco', job_title: 'Jefe de Taller Termopanel', department_id: [4, 'TALLER TERMOPANELES / TALLER TERMOPANELES'] },
  { id: 5, name: 'William Rivera Cuevas', job_title: 'Cortador', department_id: [5, 'TALLER CORTE VIDRIO'] },
]

// Cargar la lista de empleados para la pantalla Kiosco
export async function getEmployeesList() {
  try {
    await ensureAuthenticated()
    // Intentar leer solo campos seguros en Odoo (sin 'pin' que requiere grupo HR Manager)
    const list = await searchRead(
      'hr.employee',
      [],
      ['id', 'name', 'job_title', 'department_id', 'user_id'],
      { order: 'name asc', limit: 100 }
    )
    if (list && list.length > 0) return list
  } catch (err) {
    console.warn('Lectura Odoo hr.employee restringida:', err.message)
    try {
      const listBasic = await searchRead(
        'hr.employee',
        [],
        ['id', 'name', 'job_title'],
        { order: 'name asc', limit: 100 }
      )
      if (listBasic && listBasic.length > 0) return listBasic
    } catch (_) {}
  }

  // Fallback si Odoo restringe el modelo hr.employee
  return FALLBACK_EMPLOYEES
}

// ── ORM: search_read ────────────────────────────────────────
export async function searchRead(model, domain, fields, opts = {}) {
  return rpc('/web/dataset/call_kw', {
    model,
    method: 'search_read',
    args: [domain],
    kwargs: {
      fields,
      limit: opts.limit || 100,
      offset: opts.offset || 0,
      order: opts.order || 'id desc',
      context: {}
    }
  })
}

// ── ORM: read ───────────────────────────────────────────────
export async function read(model, ids, fields) {
  return rpc('/web/dataset/call_kw', {
    model,
    method: 'read',
    args: [ids],
    kwargs: { fields, context: {} }
  })
}

// ── ORM: create ─────────────────────────────────────────────
export async function create(model, values) {
  return rpc('/web/dataset/call_kw', {
    model,
    method: 'create',
    args: [values],
    kwargs: { context: {} }
  })
}

// ── ORM: write ──────────────────────────────────────────────
export async function write(model, ids, values) {
  return rpc('/web/dataset/call_kw', {
    model,
    method: 'write',
    args: [ids, values],
    kwargs: { context: {} }
  })
}

// ── Método de negocio genérico ──────────────────────────────
export async function callMethod(model, method, ids, kwargs = {}) {
  return rpc('/web/dataset/call_kw', {
    model,
    method,
    args: [ids],
    kwargs: { context: {}, ...kwargs }
  })
}

// ============================================================
// MÓDULO DE FABRICACIÓN – helpers de alto nivel
// ============================================================

// Centros de trabajo activos
export async function getWorkcenters() {
  return searchRead(
    'mrp.workcenter',
    [['active', '=', true]],
    ['id', 'name', 'code', 'color']
  )
}

// Órdenes de trabajo de un centro (pendientes + en progreso)
export async function getWorkorders(workcenterId) {
  const wos = await searchRead(
    'mrp.workorder',
    [
      ['workcenter_id', '=', workcenterId],
      ['state', 'in', ['pending', 'waiting', 'ready', 'progress']]
    ],
    [
      'id', 'name', 'state',
      'production_id', 'product_id',
      'qty_production', 'qty_produced',
      'date_start', 'duration_expected',
      'workcenter_id', 'is_user_working'
    ],
    { order: 'date_start asc' }
  )

  // Cargar 'origin' (número de cotización ej. S00266) desde mrp.production
  try {
    const prodIds = [...new Set(wos.map(w => Array.isArray(w.production_id) ? w.production_id[0] : w.production_id).filter(Boolean))]
    if (prodIds.length > 0) {
      const prods = await read('mrp.production', prodIds, ['id', 'origin'])
      const prodMap = new Map(prods.map(p => [p.id, p.origin]))
      wos.forEach(w => {
        const pId = Array.isArray(w.production_id) ? w.production_id[0] : w.production_id
        w.origin = prodMap.get(pId) || ''
      })
    }
  } catch (_) {
    // Si falla la lectura opcional de origin, continuar normalmente
  }

  return wos
}

// Detalle completo de una orden de trabajo (Odoo 19)
export async function getWorkorderDetail(workorderId) {
  const [wo] = await read(
    'mrp.workorder',
    [workorderId],
    [
      'id', 'name', 'state',
      'production_id', 'product_id',
      'qty_production', 'qty_produced',
      'date_start', 'duration_expected', 'duration',
      'workcenter_id', 'is_user_working'
    ]
  )

  if (!wo) return null

  // Componentes y Origin: vienen de la orden de fabricación padre (mrp.production)
  try {
    const prodId = Array.isArray(wo.production_id) ? wo.production_id[0] : wo.production_id
    if (prodId) {
      const [prod] = await read('mrp.production', [prodId], ['move_raw_ids', 'origin'])
      wo.origin = prod?.origin || ''

      if (prod?.move_raw_ids?.length) {
        wo.components = await read(
          'stock.move',
          prod.move_raw_ids,
          ['id', 'product_id', 'product_uom_qty', 'quantity_done', 'product_uom', 'state']
        )
      } else {
        wo.components = []
      }
    } else {
      wo.components = []
    }
  } catch (_) {
    wo.components = [] // Los componentes son opcionales; no bloquear si fallan
  }

  return wo
}


// ── Acciones del cronómetro ─────────────────────────────────
export const startWorkorder  = (id) => callMethod('mrp.workorder', 'button_start',   [id])
export const pauseWorkorder  = (id) => callMethod('mrp.workorder', 'button_pending',  [id])
export const resumeWorkorder = (id) => callMethod('mrp.workorder', 'button_start',   [id])

// Lectura mínima para refrescar solo el estado del cronómetro (campos seguros en Odoo 19)
export async function refreshWorkorderState(id) {
  const [data] = await read('mrp.workorder', [id], ['state', 'duration', 'qty_produced', 'is_user_working'])
  return data || null
}

// Finalizar orden con cantidad producida
export async function finishWorkorder(id, qtyProduced) {
  await write('mrp.workorder', [id], { qty_done: qtyProduced })
  return callMethod('mrp.workorder', 'do_finish', [id])
}

// Registrar merma/scrap
export async function registerScrap(productionId, productId, qty, uomId, locationId) {
  return create('mrp.scrap', {
    production_id: productionId,
    product_id: productId,
    scrap_qty: qty,
    product_uom_id: uomId,
    location_id: locationId || false
  })
}
