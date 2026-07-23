// ============================================================
// src/pages/WorkorderDetail.jsx
// Pantalla principal de operación: info vital + cronómetro + controles
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getWorkorderDetail, startWorkorder, pauseWorkorder, resumeWorkorder, refreshWorkorderState } from '../api/odoo'
import { getWorkorderDisplayTitle, getWorkorderCode } from '../utils/formatters'
import Topbar from '../components/Topbar'
import Timer from '../components/Timer'
import CloseModal from './CloseModal'
import OfflineBanner from '../components/OfflineBanner'

const STATE_LABELS = {
  pending:  'Pendiente',
  waiting:  'Esperando',
  ready:    'Listo para iniciar',
  progress: 'En Progreso',
  done:     'Terminado',
}

export default function WorkorderDetail() {
  const { id } = useParams()
  const { showToast } = useApp()
  const navigate = useNavigate()

  const [wo, setWo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showClose, setShowClose] = useState(false)

  const isRunning = wo?.is_user_working === true
  const isPaused  = wo?.state === 'progress' && wo?.is_user_working === false
  const isDone    = wo?.state === 'done'
  const canStart  = ['ready', 'pending', 'waiting'].includes(wo?.state) || isPaused

  // ── Carga de datos — SIEMPRE retorna Promise para poder hacer await ──
  const load = useCallback(() => {
    setLoading(true)
    return getWorkorderDetail(Number(id))
      .then(data => { if (data) setWo(data) })
      .catch(err => showToast(`Error recargando orden: ${err.message}`, 'error'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  // ── Helper genérico para acciones de botón ──────────────────
  const executeAction = async (apiFn, successMsg) => {
    setActionLoading(true)
    try {
      await apiFn()
      // Leer state + duration + qty_produced + is_user_working
      const fresh = await refreshWorkorderState(Number(id))
      if (fresh) {
        setWo(prev => ({
          ...prev,
          state:           fresh.state,
          duration:        fresh.duration,
          qty_produced:    fresh.qty_produced,
          is_user_working: fresh.is_user_working
        }))
      }
      showToast(successMsg, 'success')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleStart  = () => executeAction(() => startWorkorder(Number(id)),  '▶ Cronómetro iniciado')
  const handlePause  = () => executeAction(() => pauseWorkorder(Number(id)),  '⏸ Orden pausada')
  const handleResume = () => executeAction(() => resumeWorkorder(Number(id)), '▶ Reanudado')


  if (loading) {
    return (
      <>
        <Topbar crumbs={['Detalle de Orden']} />
        <div className="loading-center">
          <div className="spinner" />
          <span>Cargando orden...</span>
        </div>
      </>
    )
  }

  if (!wo) {
    return (
      <>
        <Topbar crumbs={['Detalle de Orden']} />
        <div className="empty-state">
          <div className="empty-state-icon">❌</div>
          <div className="empty-state-title">Orden no encontrada</div>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/orders')}>
            ← Volver
          </button>
        </div>
      </>
    )
  }

  // Convertir minutos de Odoo a segundos para el cronómetro
  const elapsedSeconds = Math.round((wo.duration || 0) * 60)
  const displayTitle = getWorkorderDisplayTitle(wo)
  const displayCode = getWorkorderCode(wo)

  return (
    <>
      <OfflineBanner />
      <Topbar crumbs={[displayTitle]} />

      <div className="page">
        {/* Header de la orden */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{displayTitle}</h1>
            <p className="page-subtitle">
              {displayCode}
              &nbsp;&nbsp;
              <span className={`badge badge-${wo.state}`}>
                {STATE_LABELS[wo.state] || wo.state}
              </span>
            </p>
          </div>
          <button
            id="btn-back-orders"
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/orders')}
          >
            ← Volver
          </button>
        </div>



        {/* Cronómetro */}
        <div className="card" style={{ textAlign: 'center' }}>
          <Timer initialSeconds={elapsedSeconds} running={isRunning} />

          {/* Barra progreso qty */}
          {wo.qty_production > 0 && (
            <div style={{ padding: '0 24px 8px' }}>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${Math.min(100, ((wo.qty_produced ?? 0) / wo.qty_production) * 100)}%` }}
                />
              </div>
              <p className="text-sm text-muted mt-8">
                {wo.qty_produced ?? 0} de {wo.qty_production} unidades producidas
              </p>
            </div>
          )}
        </div>

        {/* Controles de acción */}
        {!isDone && (
          <div className="timer-controls">
            {canStart && !isRunning && (
              <button
                id="btn-start"
                className="btn btn-success btn-xl"
                onClick={isPaused ? handleResume : handleStart}
                disabled={actionLoading}
              >
                ▶ {isPaused ? 'Reanudar' : 'Iniciar'}
              </button>
            )}

            {isRunning && (
              <button
                id="btn-pause"
                className="btn btn-warning btn-xl"
                onClick={handlePause}
                disabled={actionLoading}
              >
                ⏸ Pausar
              </button>
            )}

            <button
              id="btn-finish"
              className="btn btn-danger btn-xl"
              onClick={() => setShowClose(true)}
              disabled={actionLoading || (!isRunning && !isPaused && canStart && !isPaused)}
              style={{ minWidth: 200 }}
            >
              ✔ Finalizar
            </button>
          </div>
        )}

        {isDone && (
          <div className="card" style={{ textAlign: 'center', borderColor: 'var(--success)' }}>
            <div style={{ fontSize: '3rem' }}>✅</div>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', marginTop: 8 }}>
              Orden completada
            </p>
            <button className="btn btn-ghost btn-lg mt-16" onClick={() => navigate('/orders')}>
              ← Volver a la lista
            </button>
          </div>
        )}

        {/* Componentes (BoM) */}
        {wo.components?.length > 0 && (
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, color: 'var(--text-secondary)' }}>
              📦 Componentes requeridos
            </h2>
            {wo.components.map(c => (
              <div key={c.id} className="scrap-row">
                <span className="scrap-product-name">
                  {c.product_id?.[1]}
                  <span className="text-muted text-sm"> ({c.product_uom?.[1]})</span>
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {c.product_uom_qty} uds.
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de cierre */}
      {showClose && (
        <CloseModal
          workorder={wo}
          onCancel={() => setShowClose(false)}
          onSuccess={() => setShowClose(false)}
        />
      )}
    </>
  )
}
