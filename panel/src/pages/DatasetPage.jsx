import { useEffect, useState } from 'react'
import { searchRead } from '../odoo.js'
import { DATASETS, dateDomain } from '../datasets.js'
import DataTable from '../components/DataTable.jsx'
import GroupSummary from '../components/GroupSummary.jsx'

const LIMIT = 2000

// Pestaña de un modelo de Odoo: carga los registros del rango de fechas
export default function DatasetPage({ datasetKey, range, reloadKey }) {
  const ds = DATASETS[datasetKey]
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    searchRead(
      ds.model,
      dateDomain(ds.dateField, range.from, range.to),
      ['id', ...ds.columns.map(c => c.key)],
      { limit: LIMIT, order: ds.order }
    )
      .then(data => { if (!cancelled) setRows(data) })
      .catch(err => { if (!cancelled) { setRows([]); setError(err.message) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ds, range.from, range.to, reloadKey])

  if (loading) return <p className="muted pad">Cargando {ds.label.toLowerCase()} desde Odoo…</p>
  if (error) return <p className="error pad">No se pudo cargar {ds.label.toLowerCase()}: {error}</p>

  return (
    <>
      {rows.length >= LIMIT && (
        <p className="warning">Se muestran los primeros {LIMIT} registros. Acorta el rango de fechas para ver todo.</p>
      )}
      {ds.groupBy && rows.length > 0 && (
        <GroupSummary
          rows={rows}
          groupBy={ds.groupBy}
          columns={ds.columns}
          title={`Resumen por ${ds.columns.find(c => c.key === ds.groupBy).label.toLowerCase()}`}
        />
      )}
      <DataTable
        rows={rows}
        columns={ds.columns}
        exportName={`${datasetKey}_${range.from || 'inicio'}_${range.to || 'hoy'}`}
      />
    </>
  )
}
