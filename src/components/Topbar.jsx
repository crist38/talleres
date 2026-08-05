// ============================================================
// src/components/Topbar.jsx
// ============================================================
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Topbar({ crumbs = [] }) {
  const { selectedWorkcenter, selectedOperator, logout } = useApp()
  const navigate = useNavigate()

  return (
    <div className="topbar">
      <Link to="/" className="topbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src="/logo.png"
          alt="Logo"
          style={{ height: 32, width: 'auto', objectFit: 'contain' }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
        <span>Talleres Prowindows</span>
      </Link>

      <div className="topbar-breadcrumb">
        {selectedOperator && (
          <>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>
              👷 {selectedOperator.name.split(' ')[0]}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
          </>
        )}
        {selectedWorkcenter && (
          <>
            <span>{selectedWorkcenter.name}</span>
          </>
        )}
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
            <span>{c}</span>
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {selectedOperator && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { logout(); navigate('/') }}
            title="Cambiar operario"
            style={{ fontSize: '0.8rem' }}
          >
            🔄 Cambiar
          </button>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { logout(); navigate('/') }}
          title="Cerrar sesión"
        >
          🚪 Salir
        </button>
      </div>
    </div>
  )
}
