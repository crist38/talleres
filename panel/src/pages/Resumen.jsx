import { useEffect, useState } from 'react'
import { searchRead } from '../odoo.js'
import { dateDomain } from '../datasets.js'
import { formatMoney, formatNumber, formatMinutes } from '../format.js'

// Los indicadores suman todo el rango, sin tope de registros
const readAll = (model, domain, fields) => searchRead(model, domain, fields, { limit: null })
const sum = (rows, key) => rows.reduce((s, r) => s + (Number(r[key]) || 0), 0)

// Cada indicador es independiente: si un módulo no está instalado
// o el usuario no tiene permiso, solo esa tarjeta muestra el error.
const KPIS = [
  {
    id: 'ventas',
    tab: 'ventas',
    title: 'Ventas confirmadas',
    load: (r) => readAll('sale.order',
      [['state', '=', 'sale'], ...dateDomain('date_order', r.from, r.to)],
      ['amount_untaxed']),
    value: rows => formatMoney(sum(rows, 'amount_untaxed')),
    detail: rows => `${rows.length} órdenes · neto`
  },
  {
    id: 'cotizaciones',
    tab: 'ventas',
    title: 'Cotizaciones abiertas',
    load: (r) => readAll('sale.order',
      [['state', 'in', ['draft', 'sent']], ...dateDomain('date_order', r.from, r.to)],
      ['amount_untaxed']),
    value: rows => formatMoney(sum(rows, 'amount_untaxed')),
    detail: rows => `${rows.length} cotizaciones sin confirmar`
  },
  {
    id: 'of_abiertas',
    tab: 'fabricacion',
    title: 'Fabricación en curso',
    // Sin filtro de fechas: todo lo que está abierto hoy
    load: () => readAll('mrp.production',
      [['state', 'in', ['confirmed', 'progress', 'to_close']]],
      ['state']),
    value: rows => formatNumber(rows.length),
    detail: rows => `${rows.filter(r => r.state === 'progress').length} en progreso · ${rows.filter(r => r.state === 'to_close').length} por cerrar`
  },
  {
    id: 'of_terminadas',
    tab: 'fabricacion',
    title: 'Órdenes terminadas',
    load: (r) => readAll('mrp.production',
      [['state', '=', 'done'], ...dateDomain('date_finished', r.from, r.to)],
      ['product_qty']),
    value: rows => formatNumber(rows.length),
    detail: rows => `${formatNumber(sum(rows, 'product_qty'))} unidades`
  },
  {
    id: 'tiempos',
    tab: 'tiempos',
    title: 'Tiempo trabajado',
    load: (r) => readAll('mrp.workorder',
      [['state', '=', 'done'], ...dateDomain('date_finished', r.from, r.to)],
      ['duration', 'duration_expected']),
    value: rows => formatMinutes(sum(rows, 'duration')),
    detail: rows => {
      const expected = sum(rows, 'duration_expected')
      return expected
        ? `${Math.round(sum(rows, 'duration') / expected * 100)}% del tiempo esperado`
        : `${rows.length} operaciones terminadas`
    }
  },
  {
    id: 'mermas',
    tab: 'mermas',
    title: 'Mermas',
    load: (r) => readAll('stock.scrap',
      [['state', '=', 'done'], ...dateDomain('date_done', r.from, r.to)],
      ['scrap_qty']),
    value: rows => formatNumber(rows.length),
    detail: rows => `${formatNumber(sum(rows, 'scrap_qty'))} unidades desechadas`
  },
  {
    id: 'compras',
    tab: 'compras',
    title: 'Compras',
    load: (r) => readAll('purchase.order',
      [['state', 'in', ['purchase', 'done']], ...dateDomain('date_order', r.from, r.to)],
      ['amount_untaxed']),
    value: rows => formatMoney(sum(rows, 'amount_untaxed')),
    detail: rows => `${rows.length} órdenes de compra · neto`
  }
]

export default function Resumen({ range, reloadKey, onOpenTab }) {
  const [results, setResults] = useState({})

  useEffect(() => {
    let cancelled = false
    setResults({})
    KPIS.forEach(k => {
      k.load(range)
        .then(rows => { if (!cancelled) setResults(prev => ({ ...prev, [k.id]: { rows } })) })
        .catch(err => { if (!cancelled) setResults(prev => ({ ...prev, [k.id]: { error: err.message } })) })
    })
    return () => { cancelled = true }
  }, [range.from, range.to, reloadKey])

  return (
    <div className="kpi-grid">
      {KPIS.map(k => {
        const res = results[k.id]
        return (
          <button key={k.id} className="kpi" onClick={() => onOpenTab(k.tab)}>
            <span className="kpi-title">{k.title}</span>
            {!res && <span className="kpi-value muted">…</span>}
            {res?.error && <span className="kpi-error">No disponible: {res.error}</span>}
            {res?.rows && (
              <>
                <span className="kpi-value">{k.value(res.rows)}</span>
                <span className="kpi-detail">{k.detail(res.rows)}</span>
              </>
            )}
          </button>
        )
      })}
    </div>
  )
}
