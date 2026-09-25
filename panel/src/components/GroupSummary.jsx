import { useMemo } from 'react'
import { displayTotal } from '../format.js'

// Resumen agrupado (ej. tiempos por taller, mermas por producto)
export default function GroupSummary({ rows, groupBy, columns, title }) {
  const totalCols = useMemo(() => columns.filter(c => c.total), [columns])

  const groups = useMemo(() => {
    const map = new Map()
    rows.forEach(r => {
      const g = r[groupBy]
      const name = Array.isArray(g) ? g[1] : 'Sin asignar'
      if (!map.has(name)) map.set(name, { name, count: 0, sums: {} })
      const entry = map.get(name)
      entry.count++
      totalCols.forEach(c => { entry.sums[c.key] = (entry.sums[c.key] || 0) + (Number(r[c.key]) || 0) })
    })
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [rows, groupBy, totalCols])

  if (groups.length === 0) return null
  const showEfficiency = totalCols.some(c => c.key === 'duration') && totalCols.some(c => c.key === 'duration_expected')

  return (
    <div className="group-summary">
      <h3>{title}</h3>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{columns.find(c => c.key === groupBy)?.label}</th>
              <th className="num">Registros</th>
              {totalCols.map(c => <th key={c.key} className="num">{c.label}</th>)}
              {showEfficiency && <th className="num">Real vs esperado</th>}
            </tr>
          </thead>
          <tbody>
            {groups.map(g => {
              const ratio = showEfficiency && g.sums.duration_expected
                ? g.sums.duration / g.sums.duration_expected
                : null
              return (
                <tr key={g.name}>
                  <td>{g.name}</td>
                  <td className="num">{g.count}</td>
                  {totalCols.map(c => <td key={c.key} className="num">{displayTotal(g.sums[c.key], c)}</td>)}
                  {showEfficiency && (
                    <td className={`num ${ratio > 1.1 ? 'bad' : ratio !== null ? 'good' : ''}`}>
                      {ratio === null ? '—' : `${Math.round(ratio * 100)}%`}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
