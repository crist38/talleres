// ============================================================
// src/pages/WorkcenterSelect.jsx
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getWorkcenters } from '../api/odoo'
import { filterWorkcentersForOperator } from '../utils/formatters'
import Topbar from '../components/Topbar'
import OfflineBanner from '../components/OfflineBanner'
import OdooAdminModal from '../components/OdooAdminModal'

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
  const { selectedOperator, selectWorkcenter, showToast } = useApp()
  const navigate = useNavigate()
  const [workcenters, setWorkcenters] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdminModal, setShowAdminModal] = useState(false)

  const loadWorkcenters = useCallback(() => {
    setLoading(true)
    getWorkcenters()
      .then(list => {
        setWorkcenters(list || [])
        setShowAdminModal(false)
      })
      .catch(err => {
        if (err.message?.includes('Acceso denegado') || err.message?.includes('AccessDenied') || err.message?.includes('Session expired') || err.message?.includes('expiró')) {
          setShowAdminModal(true)
        } else {
          showToast(`Error cargando centros: ${err.message}`, 'error')
        }
      })
      .finally(() => setLoading(false))
  }, [showToast])

  useEffect(() => {
    loadWorkcenters()
  }, [loadWorkcenters])

  const handleSelect = (wc) => {
    selectWorkcenter(wc)
    navigate('/orders')
  }

  const availableWorkcenters = filterWorkcentersForOperator(workcenters, selectedOperator)

  return (
    <>
      <OfflineBanner />
      <Topbar />
      <div className="page workcenter-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Selecciona tu Centro de Trabajo</h1>
            <p className="page-subtitle">
              {selectedOperator ? `Operador: ${selectedOperator.name}` : 'Toca la estación donde estás operando hoy'}
            </p>
          </div>
          <div className="flex gap-8">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowAdminModal(true)}
              title="Configurar conexión Odoo"
            >
              ⚙️ Conexión
            </button>
            <button
              id="btn-refresh-workcenters"
              className="btn btn-ghost btn-sm"
              onClick={loadWorkcenters}
              disabled={loading}
            >
              🔄 Actualizar
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <span>Cargando centros de trabajo...</span>
          </div>
        ) : availableWorkcenters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏭</div>
            <div className="empty-state-title">Sin centros asignados</div>
            <div className="empty-state-desc">
              No hay estaciones de trabajo disponibles para {selectedOperator?.name || 'este operario'}.
            </div>
            <button
              className="btn btn-primary mt-16"
              onClick={loadWorkcenters}
            >
              🔄 Reintentar
            </button>
          </div>
        ) : (
          <div className="grid-4">
            {availableWorkcenters.map(wc => (
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

      {/* Modal de Configuración de Conexión Odoo */}
      {showAdminModal && (
        <OdooAdminModal
          onConnected={() => {
            setShowAdminModal(false)
            loadWorkcenters()
          }}
          onCancel={() => setShowAdminModal(false)}
        />
      )}
    </>
  )
}
