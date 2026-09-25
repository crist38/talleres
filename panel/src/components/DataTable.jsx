import { useMemo, useState } from 'react'
import { displayValue, displayTotal, rawValue, downloadCsv } from '../format.js'

// Tabla con búsqueda, filtro por estado, orden por columna y totales
export default function DataTable({ rows, columns, exportName }) {
  const [query, setQuery] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [sort, setSort] = useState({ key: null, dir: 1 })

  const stateCol = columns.find(c => c.key === 'state')
  const stateOptions = useMemo(() => {
    if (!stateCol) return []
    return [...new Set(rows.map(r => r.state).filter(Boolean))]
  }, [rows, stateCol])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = rows.filter(r => {
      if (stateFilter && r.state !== stateFilter) return false
      if (!q) return true
      return columns.some(c => String(rawValue(r, c)).toLowerCase().includes(q))
    })
    if (sort.key) {
      const col = columns.find(c => c.key === sort.key)
      out = [...out].sort((a, b) => {
        // Fechas: se ordena por el valor de Odoo (ISO), no por el texto local
        const key = (r) => col.type === 'date' ? (r[col.key] || '') : rawValue(r, col)
        const va = key(a), vb = key(b)
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * sort.dir
        return String(va).localeCompare(String(vb), 'es') * sort.dir
      })
    }
    return out
  }, [rows, columns, query, stateFilter, sort])

  const totals = useMemo(() => {
    const t = {}
    columns.filter(c => c.total).forEach(c => {
      t[c.key] = filtered.reduce((sum, r) => sum + (Number(r[c.key]) || 0), 0)
    })
    return t
  }, [filtered, columns])

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: 1 })
  }

  return (
    <div className="table-block">
      <div className="table-tools">
        <input
          type="search"
          placeholder="Buscar…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {stateCol && (
          <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
            <option value="">Todos los estados</option>
            {stateOptions.map(s => (
              <option key={s} value={s}>{stateCol.states?.[s] || s}</option>
            ))}
          </select>
        )}
        <span className="muted">{filtered.length} de {rows.length} registros</span>
        <button
          className="btn-secondary"
          disabled={filtered.length === 0}
          onClick={() => downloadCsv(`${exportName}.csv`, filtered, columns)}
        >
          Descargar CSV
        </button>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {columns.map(c => (
                <th
                  key={c.key}
                  className={isNumeric(c) ? 'num' : ''}
                  onClick={() => toggleSort(c.key)}
                >
                  {c.label}
                  {sort.key === c.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                {columns.map(c => (
                  <td key={c.key} className={isNumeric(c) ? 'num' : ''}>
                    {c.type === 'state'
                      ? <span className={`badge st-${r[c.key]}`}>{displayValue(r, c)}</span>
                      : displayValue(r, c)}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={columns.length} className="empty">Sin registros para estos filtros</td></tr>
            )}
          </tbody>
          {Object.keys(totals).length > 0 && filtered.length > 0 && (
            <tfoot>
              <tr>
                {columns.map((c, i) => (
                  <td key={c.key} className={isNumeric(c) ? 'num' : ''}>
                    {c.key in totals ? displayTotal(totals[c.key], c) : i === 0 ? 'Total' : ''}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function isNumeric(c) {
  return c.type === 'money' || c.type === 'number' || c.type === 'minutes'
}
