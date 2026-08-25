// ============================================================
// src/utils/formatters.js
// Utilidades de formateo de texto para la interfaz de planta
// ============================================================

/**
 * Formatea el nombre de la orden de fabricación para talleres (ej: Corte Vidrio)
 * Ejemplo de entrada: "[V1] HERMAN ROJAS | Corte Vidrio | 540 × 1380 mm | C1: Cristal Dim. Incoloro 4mm | C2: Cristal Dim. Incoloro 4mm"
 * Ejemplo de salida:  "HERMAN ROJAS, V1 | 540 × 1380 mm | C1: Cristal Dim. Incoloro 4mm | C2: Cristal Dim. Incoloro 4mm"
 */
export function formatOrderProductName(rawName) {
  if (!rawName || typeof rawName !== 'string') return ''

  // Si no tiene tuberías '|', se devuelve tal cual
  if (!rawName.includes('|')) return rawName

  const parts = rawName.split('|').map(p => p.trim()).filter(Boolean)
  if (parts.length === 0) return rawName

  // 1. Parsear Cliente y Versión de la primera parte (ej: "[V1] HERMAN ROJAS")
  let clientVersionStr = parts[0]
  const matchBracketsStart = clientVersionStr.match(/^\[(.*?)\]\s*(.*)$/)
  const matchBracketsEnd = clientVersionStr.match(/^(.*?)\s*\[(.*?)\]$/)

  if (matchBracketsStart) {
    const version = matchBracketsStart[1]
    const client = matchBracketsStart[2]
    clientVersionStr = client ? `${client}, ${version}` : version
  } else if (matchBracketsEnd) {
    const client = matchBracketsEnd[1]
    const version = matchBracketsEnd[2]
    clientVersionStr = client ? `${client}, ${version}` : version
  }

  // 2. Procesar las demás partes omitiendo el nombre redundante del producto (segunda posición)
  const detailParts = []

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]

    // Omitir la posición 1 (el nombre del producto/operación como "Corte Vidrio")
    if (i === 1) {
      continue
    }

    // Omitir medidas nulas "0 x 0 mm" o "0x0 mm"
    if (/^0\s*x\s*0/i.test(part)) {
      continue
    }

    detailParts.push(part)
  }

  if (detailParts.length > 0) {
    return `${clientVersionStr} | ${detailParts.join(' | ')}`
  }

  return clientVersionStr
}

/**
 * Obtiene el título principal legible de la orden de trabajo.
 * Evalúa wo.name, wo.production_id y wo.product_id para encontrar
 * la información detallada con '|' (Cliente | Medidas | Cristales),
 * evitando mostrar nombres genéricos como "[TP4+10+4] DVH 4+10+4 (Generico)".
 */
export function getWorkorderDisplayTitle(wo) {
  if (!wo) return 'Orden sin nombre'

  const woName = typeof wo.name === 'string' ? wo.name : ''
  const prodName = Array.isArray(wo.production_id) ? wo.production_id[1] : (typeof wo.production_id === 'string' ? wo.production_id : '')
  const productName = Array.isArray(wo.product_id) ? wo.product_id[1] : (typeof wo.product_id === 'string' ? wo.product_id : '')

  // 1. Buscar cuál de los campos contiene la estructura rica con '|' (Cliente | Operación | Medidas | Cristales)
  if (woName && woName.includes('|')) {
    return formatOrderProductName(woName)
  }
  if (prodName && prodName.includes('|')) {
    return formatOrderProductName(prodName)
  }
  if (productName && productName.includes('|')) {
    return formatOrderProductName(productName)
  }

  // 2. Si ninguno tiene '|', descartar los que digan "(Generico)"
  if (woName && !woName.toLowerCase().includes('generico')) {
    return formatOrderProductName(woName)
  }
  if (prodName && !prodName.startsWith('WH/MO/')) {
    return formatOrderProductName(prodName)
  }

  return formatOrderProductName(productName) || woName || prodName || 'Orden sin nombre'
}

/**
 * Obtiene el código corto o número de cotización de la orden (ej: "Cotización: S00266 • WH/MO/00780")
 */
export function getWorkorderCode(wo) {
  if (!wo) return ''

  const origin = wo.origin ? `Cotización: ${wo.origin}` : ''
  const prodName = Array.isArray(wo.production_id) ? wo.production_id[1] : (typeof wo.production_id === 'string' ? wo.production_id : '')
  const woName = typeof wo.name === 'string' ? wo.name : ''

  let moCode = ''
  if (prodName && prodName.startsWith('WH/MO/')) {
    moCode = prodName
  } else if (woName && !woName.includes('|')) {
    moCode = woName
  }

  if (origin && moCode) {
    return `${origin} • ${moCode}`
  }

  return origin || moCode || ''
}

// ============================================================
// Secuencia de producción PVC (orden fijo 1 → 2 → 3 → Finalizado)
// Los nombres deben coincidir con los registrados en Odoo (sin distinguir mayúsculas).
// ============================================================
export const PVC_SEQUENCE = [
  { step: 1, keywords: ['corte perfiles pvc', 'corte de perfiles pvc'] },
  { step: 2, keywords: ['corte armado pvc']                             },
  { step: 3, keywords: ['corte armado final pvc', 'armado final pvc']   },
]

/**
 * Devuelve el número de paso PVC (1, 2, 3) para un workcenter,
 * o null si no pertenece a la secuencia PVC.
 */
export function getPVCStep(workcenter) {
  if (!workcenter?.name) return null
  const wcName = workcenter.name.toLowerCase()
  for (const { step, keywords } of PVC_SEQUENCE) {
    if (keywords.some(kw => wcName.includes(kw))) return step
  }
  return null
}

/**
 * Ordena una lista de workcenters PVC según la secuencia definida en PVC_SEQUENCE.
 * Los que no pertenezcan a la secuencia van al final, en su orden original.
 */
export function sortPVCWorkcenters(workcenters = []) {
  return [...workcenters].sort((a, b) => {
    const stepA = getPVCStep(a) ?? 999
    const stepB = getPVCStep(b) ?? 999
    return stepA - stepB
  })
}

/**
 * Filtra los centros de trabajo según los permisos asignados a cada operario:
 * - Daniel Pacheco: solo talleres de Termopaneles
 * - William Rivera Cuevas (Williams): solo Corte de Vidrio
 * - Cristian Tabilo: todos los talleres de PVC
 * - Carlos Contreras R. & Cristian Pereira: acceso a TODOS los talleres
 */
export function filterWorkcentersForOperator(workcenters = [], operator = null) {
  if (!operator || !operator.name) return workcenters

  const name = operator.name.toLowerCase()

  // Carlos Contreras R. y Cristian Pereira -> Todos los talleres
  if (name.includes('carlos') || name.includes('pereira')) {
    return workcenters
  }

  // Daniel Pacheco -> Solo Termopaneles
  if (name.includes('daniel') || name.includes('pacheco')) {
    const filtered = workcenters.filter(wc => {
      const wcName = (wc.name || '').toLowerCase()
      return wcName.includes('termopanel') || wcName.includes('termo')
    })
    return filtered.length > 0 ? filtered : workcenters
  }

  // William Rivera Cuevas (Williams) -> Exclusivamente Taller Corte Vidrio
  if (name.includes('william') || name.includes('williams') || name.includes('rivera')) {
    const filtered = workcenters.filter(wc => {
      const wcName = (wc.name || '').toLowerCase()
      return wcName.includes('corte vidrio') || wcName.includes('corte de vidrio') || (wcName.includes('corte') && wcName.includes('vidrio'))
    })
    return filtered.length > 0 ? filtered : workcenters
  }

  // Cristian Tabilo -> Todos los talleres de PVC
  if (name.includes('tabilo')) {
    const filtered = workcenters.filter(wc => {
      const wcName = (wc.name || '').toLowerCase()
      return wcName.includes('pvc')
    })
    return filtered.length > 0 ? filtered : workcenters
  }

  return workcenters
}
