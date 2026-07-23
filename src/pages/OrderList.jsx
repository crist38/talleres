// ============================================================
// src/pages/OrderList.jsx
// ============================================================
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getWorkorders } from '../api/odoo'
import Topbar from '../components/Topbar'
import OrderCard from '../components/OrderCard'
import OfflineBanner from '../components/OfflineBanner'

const FILTERS = [
  { key: 'all',      label: 'Todas' },
  { key: 'ready',    label: '🔵 Listas' },
  { key: 'progress', label: '🟠 En Progreso' },
  { key: 'pending',  label: '⬜ Pendientes' },
]

export default function OrderList() {
  const { selectedWorkcenter, showToast } = useApp()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    if (!selectedWorkcenter) { navigate('/workcenter'); return }
    setLoading(true)
    getWorkorders(selectedWorkcenter.id)
      .then(setOrders)
      .catch(err => showToast(`Error cargando órdenes: ${err.message}`, 'error'))
      .finally(() => setLoading(false))
  }, [selectedWorkcenter])

  useEffect(() => { load() }, [load])

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.state === filter || (filter === 'pending' && ['pending', 'waiting'].includes(o.state)))

  return (
    <>
      <OfflineBanner />
      <Topbar />
      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Órdenes de Trabajo</h1>
            {selectedWorkcenter && (
              <p className="page-subtitle">📍 {selectedWorkcenter.name} · {orders.length} orden{orders.length !== 1 ? 'es' : ''}</p>
            )}
          </div>
          <button
            id="btn-refresh-orders"
            className="btn btn-ghost btn-sm"
            onClick={load}
            disabled={loading}
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              id={`filter-${f.key}`}
              className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <span>Cargando órdenes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">Sin órdenes disponibles</div>
            <div className="empty-state-desc">
              No hay órdenes de trabajo {filter !== 'all' ? 'con este estado ' : ''}para este centro.
            </div>
          </div>
        ) : (
          <div className="grid-2">
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
