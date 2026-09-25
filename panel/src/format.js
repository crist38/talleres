// ============================================================
// src/format.js – formato de valores de Odoo para mostrar y exportar
// ============================================================

const money = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const DATE = { day: '2-digit', month: '2-digit', year: 'numeric' }
const DATETIME = { ...DATE, hour: '2-digit', minute: '2-digit' }
const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 })

// Odoo entrega fechas en UTC sin zona: 'YYYY-MM-DD HH:MM:SS'
export function parseOdooDate(value) {
  if (!value) return null
  return new Date(value.replace(' ', 'T') + (value.length > 10 ? 'Z' : ''))
}

export function formatMinutes(min) {
  if (!min) return '0 min'
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? `${h} h ${m} min` : `${m} min`
}

// Valor "crudo" comparable (para ordenar y exportar)
export function rawValue(row, col) {
  const v = row[col.key]
  if (v === false || v === null || v === undefined) return ''
  if (col.type === 'm2o') return Array.isArray(v) ? v[1] : ''
  if (col.type === 'state') return col.states?.[v] || v
  if (col.type === 'date') return parseOdooDate(v)?.toLocaleString('es-CL', v.length > 10 ? DATETIME : DATE) ?? ''
  return v
}

export function displayValue(row, col) {
  const v = row[col.key]
  if (v === false || v === null || v === undefined || v === '') return '—'
  switch (col.type) {
    case 'money': return money.format(v)
    case 'number': return number.format(v)
    case 'minutes': return formatMinutes(v)
    case 'date': {
      const d = parseOdooDate(v)
      return d ? d.toLocaleString('es-CL', v.length > 10 ? DATETIME : DATE) : '—'
    }
    default: return String(rawValue(row, col))
  }
}

export function displayTotal(value, col) {
  if (col.type === 'money') return money.format(value)
  if (col.type === 'minutes') return formatMinutes(value)
  return number.format(value)
}

export const formatMoney = (v) => money.format(v || 0)
export const formatNumber = (v) => number.format(v || 0)

// Exporta filas a CSV (separador ';' para que Excel en español lo abra bien)
export function downloadCsv(filename, rows, columns) {
  const esc = (v) => {
    const s = String(v ?? '')
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [
    columns.map(c => esc(c.label)).join(';'),
    ...rows.map(r => columns.map(c => {
      const v = rawValue(r, c)
      return esc(typeof v === 'number' ? String(v).replace('.', ',') : v)
    }).join(';'))
  ]
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
