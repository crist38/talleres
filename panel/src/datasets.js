// ============================================================
// src/datasets.js
// Qué se consulta en Odoo para cada pestaña del panel
// dateField: campo usado para filtrar por el rango de fechas elegido
// ============================================================

const SALE_STATES = {
  draft: 'Cotización', sent: 'Cotización enviada', sale: 'Venta confirmada', cancel: 'Cancelada'
}
const INVOICE_STATES = {
  'to invoice': 'Por facturar', invoiced: 'Facturada', no: 'Nada que facturar', upselling: 'Oportunidad'
}
const MO_STATES = {
  draft: 'Borrador', confirmed: 'Confirmada', progress: 'En progreso',
  to_close: 'Por cerrar', done: 'Terminada', cancel: 'Cancelada'
}
const WO_STATES = {
  pending: 'Esperando otra operación', waiting: 'Esperando componentes', ready: 'Lista',
  progress: 'En progreso', done: 'Terminada', cancel: 'Cancelada', blocked: 'Bloqueada'
}
const SCRAP_STATES = { draft: 'Borrador', done: 'Hecha' }
const PURCHASE_STATES = {
  draft: 'Solicitud', sent: 'Solicitud enviada', 'to approve': 'Por aprobar',
  purchase: 'Orden de compra', done: 'Bloqueada', cancel: 'Cancelada'
}

export const DATASETS = {
  ventas: {
    label: 'Ventas',
    model: 'sale.order',
    dateField: 'date_order',
    order: 'date_order desc',
    columns: [
      { key: 'name', label: 'Número' },
      { key: 'date_order', label: 'Fecha', type: 'date' },
      { key: 'partner_id', label: 'Cliente', type: 'm2o' },
      { key: 'user_id', label: 'Vendedor', type: 'm2o' },
      { key: 'state', label: 'Estado', type: 'state', states: SALE_STATES },
      { key: 'invoice_status', label: 'Facturación', type: 'state', states: INVOICE_STATES },
      { key: 'amount_untaxed', label: 'Neto', type: 'money', total: true },
      { key: 'amount_total', label: 'Total', type: 'money', total: true }
    ]
  },
  fabricacion: {
    label: 'Fabricación',
    model: 'mrp.production',
    dateField: 'date_start',
    order: 'date_start desc',
    columns: [
      { key: 'name', label: 'Orden' },
      { key: 'origin', label: 'Origen' },
      { key: 'product_id', label: 'Producto', type: 'm2o' },
      { key: 'product_qty', label: 'Cantidad', type: 'number', total: true },
      { key: 'qty_producing', label: 'Producida', type: 'number', total: true },
      { key: 'state', label: 'Estado', type: 'state', states: MO_STATES },
      { key: 'date_start', label: 'Inicio', type: 'date' },
      { key: 'date_finished', label: 'Fin', type: 'date' }
    ]
  },
  tiempos: {
    label: 'Tiempos',
    model: 'mrp.workorder',
    dateField: 'date_start',
    order: 'date_start desc',
    columns: [
      { key: 'production_id', label: 'Orden fabricación', type: 'm2o' },
      { key: 'name', label: 'Operación' },
      { key: 'workcenter_id', label: 'Taller', type: 'm2o' },
      { key: 'state', label: 'Estado', type: 'state', states: WO_STATES },
      { key: 'qty_produced', label: 'Producida', type: 'number', total: true },
      { key: 'duration_expected', label: 'Esperado', type: 'minutes', total: true },
      { key: 'duration', label: 'Real', type: 'minutes', total: true },
      { key: 'date_start', label: 'Inicio', type: 'date' }
    ],
    groupBy: 'workcenter_id'
  },
  mermas: {
    label: 'Mermas',
    model: 'stock.scrap',
    dateField: 'date_done',
    order: 'date_done desc',
    columns: [
      { key: 'name', label: 'Referencia' },
      { key: 'date_done', label: 'Fecha', type: 'date' },
      { key: 'product_id', label: 'Producto', type: 'm2o' },
      { key: 'scrap_qty', label: 'Cantidad', type: 'number', total: true },
      { key: 'product_uom_id', label: 'Unidad', type: 'm2o' },
      { key: 'production_id', label: 'Orden fabricación', type: 'm2o' },
      { key: 'workorder_id', label: 'Operación', type: 'm2o' },
      { key: 'state', label: 'Estado', type: 'state', states: SCRAP_STATES }
    ],
    groupBy: 'product_id'
  },
  compras: {
    label: 'Compras',
    model: 'purchase.order',
    dateField: 'date_order',
    order: 'date_order desc',
    columns: [
      { key: 'name', label: 'Número' },
      { key: 'date_order', label: 'Fecha', type: 'date' },
      { key: 'partner_id', label: 'Proveedor', type: 'm2o' },
      { key: 'origin', label: 'Origen' },
      { key: 'state', label: 'Estado', type: 'state', states: PURCHASE_STATES },
      { key: 'amount_untaxed', label: 'Neto', type: 'money', total: true },
      { key: 'amount_total', label: 'Total', type: 'money', total: true }
    ]
  }
}

// Construye el dominio de fechas. Odoo guarda las fechas en UTC con formato
// 'YYYY-MM-DD HH:MM:SS', así que convertimos los límites del día local a UTC.
export function toOdooUtc(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

export function dateDomain(dateField, from, to) {
  const domain = []
  if (from) domain.push([dateField, '>=', toOdooUtc(new Date(`${from}T00:00:00`))])
  if (to) domain.push([dateField, '<=', toOdooUtc(new Date(`${to}T23:59:59`))])
  return domain
}
