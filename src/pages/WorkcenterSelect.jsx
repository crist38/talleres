// ============================================================
// src/pages/WorkcenterSelect.jsx
// ============================================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getWorkcenters } from '../api/odoo'
import Topbar from '../components/Topbar'
import OfflineBanner from '../components/OfflineBanner'

// Iconos por nombre de workcenter (heurística)
function getIcon(name = '') {
  const n = name.toLowerCase()
  if (n.includes('cort'))    return '✂️'
  if (n.includes('ensam'))   return '🔧'
  if (n.includes('sold'))    return '🔥'
  if (n.includes('pintur'))  return '🎨'
  if (n.includes('empaque')) return '📦'
  if (n.includes('control')) return '🔍'
  if (n.includes('cristal')) return '🪟'
  if (n.includes('perfil'))  return '📐'
  if (n.includes('doblad'))  return '↩️'
  return '🏭'
}

export default function WorkcenterSelect() {
  const { selectWorkcenter, showToast } = useApp()
  const navigate = useNavigate()
  const [workcenters, setWorkcenters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getWorkcenters()
      .then(setWorkcenters)
      .catch(err => showToast(`Error cargando centros: ${err.message}`, 'error'))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (wc) => {
    selectWorkcenter(wc)
    navigate('/orders')
  }

  return (
    <>
      <OfflineBanner />
      <Topbar />
      <div className="page workcenter-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Selecciona tu Centro de Trabajo</h1>
            <p className="page-subtitle">Toca la estación donde estás operando hoy</p>
          </div>
          <button
            id="btn-refresh-workcenters"
            className="btn btn-ghost btn-sm"
            onClick={() => { setLoading(true); getWorkcenters().then(setWorkcenters).finally(() => setLoading(false)) }}
          >
            🔄 Actualizar
          </button>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <span>Cargando centros de trabajo...</span>
          </div>
        ) : workcenters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏭</div>
            <div className="empty-state-title">Sin centros configurados</div>
            <div className="empty-state-desc">
              No hay centros de trabajo activos en Odoo. Pide a tu administrador que los configure.
            </div>
          </div>
        ) : (
          <div className="grid-4">
            {workcenters.map(wc => (
              <button
                key={wc.id}
                id={`workcenter-${wc.id}`}
                className="card card-interactive workcenter-card"
                onClick={() => handleSelect(wc)}
                aria-label={`Seleccionar ${wc.name}`}
              >
                <div className="workcenter-icon">{getIcon(wc.name)}</div>
                <div className="workcenter-name">{wc.name}</div>
                {wc.code && <div className="workcenter-code">{wc.code}</div>}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
