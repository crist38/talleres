// ============================================================
// src/components/OrderCard.jsx
// Renderiza la orden en modo 'grid' (tarjeta) o 'list' (fila compacta)
// ============================================================
import { useNavigate } from 'react-router-dom'
import { getWorkorderDisplayTitle, getWorkorderCode } from '../utils/formatters'

const STATE_MAP = {
  pending:  { label: 'Pendiente',   cls: 'badge-pending',  dot: '⬤' },
  waiting:  { label: 'Esperando',   cls: 'badge-waiting',  dot: '⬤' },
  ready:    { label: 'Listo',       cls: 'badge-ready',    dot: '⬤' },
  progress: { label: 'En Progreso', cls: 'badge-progress', dot: '⬤' },
  done:     { label: 'Terminado',   cls: 'badge-done',     dot: '⬤' },
}

export default function OrderCard({ order, viewMode = 'grid' }) {
  const navigate = useNavigate()
  const st = STATE_MAP[order.state] || STATE_MAP.pending

  const pct = order.qty_production > 0
    ? Math.min(100, Math.round((order.qty_produced / order.qty_production) * 100))
    : 0

  const title = getWorkorderDisplayTitle(order)
  const code = getWorkorderCode(order)

  // ── Modo Lista Compacta ─────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <div
        className="order-list-row"
        onClick={() => navigate(`/workorder/${order.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && navigate(`/workorder/${order.id}`)}
        aria-label={`Orden ${code || order.id}`}
      >
        <div className="order-list-col-state">
          <span className={`badge ${st.cls}`}>
            <span style={{ fontSize: '0.55rem' }}>{st.dot}</span>
            {st.label}
          </span>
        </div>

        <div className="order-list-col-info">
          <div className="order-list-title" title={title}>{title}</div>
          {code && <div className="order-list-code">{code}</div>}
        </div>

        <div className="order-list-col-progress">
          <div className="order-list-qty">
            Producido: <strong>{order.qty_produced ?? 0}</strong> / {order.qty_production}
          </div>
          <div className="progress-bar-container" style={{ width: 100, height: 6 }}>
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="order-list-col-action">
          <span className="btn btn-ghost btn-sm" style={{ pointerEvents: 'none' }}>
            Abrir →
          </span>
        </div>
      </div>
    )
  }

  // ── Modo Detalle / Tarjeta ──────────────────────────────────
  return (
    <div
      className="card card-interactive"
      onClick={() => navigate(`/workorder/${order.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && navigate(`/workorder/${order.id}`)}
      aria-label={`Orden ${code || order.id}`}
    >
      <div className="order-card-header">
        <div style={{ flex: 1, paddingRight: 12 }}>
          <div className="order-card-name">
            {title}
          </div>
          {code && (
            <div className="order-card-ref">
              {code}
            </div>
          )}
        </div>
        <span className={`badge ${st.cls}`}>
          <span style={{ fontSize: '0.55rem' }}>{st.dot}</span>
          {st.label}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="progress-bar-container mt-8">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="order-card-footer">
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Producido: <strong style={{ color: 'var(--text-primary)' }}>
            {order.qty_produced ?? 0} / {order.qty_production}
          </strong>
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700 }}>
          Abrir →
        </span>
      </div>
    </div>
  )
}
