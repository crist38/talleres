// ============================================================
// src/components/OdooAdminModal.jsx
// Modal de configuración de conexión Odoo para el Terminal de Planta
// ============================================================
import { useState } from 'react'
import { useApp } from '../context/AppContext'

export default function OdooAdminModal({ onConnected, onCancel }) {
  const { login, isAuthLoading } = useApp()
  const [user, setUser] = useState(localStorage.getItem('odoo_user') || 'api_operarios')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const dbName = localStorage.getItem('odoo_db') || import.meta.env.VITE_ODOO_DB || 'prowindows-ltda'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const success = await login(dbName, user, password)
    if (success) {
      if (onConnected) onConnected()
    } else {
      setError('Credenciales inválidas. Verifica tu usuario y contraseña de Odoo.')
    }
  }

  return (
    <div className="modal-backdrop" style={{ zIndex: 9999 }}>
      <div className="modal" style={{ maxWidth: 420, padding: 32 }}>
        <div className="modal-title" style={{ fontSize: '1.3rem', marginBottom: 6 }}>
          ⚙️ Conectar Terminal con Odoo
        </div>
        <p className="text-muted text-sm" style={{ marginBottom: 20 }}>
          Ingresa las credenciales de tu usuario de Odoo para vincular este terminal de planta.
        </p>

        {error && (
          <div className="login-error" style={{ marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div>
            <label className="input-label" htmlFor="admin-user">Usuario / Correo Odoo</label>
            <input
              id="admin-user"
              className="login-input"
              type="text"
              placeholder="api_operarios o tu correo"
              value={user}
              onChange={e => setUser(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label" htmlFor="admin-pass">Contraseña Odoo</label>
            <input
              id="admin-pass"
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-8 mt-16">
            {onCancel && (
              <button
                type="button"
                className="btn btn-ghost flex-1"
                onClick={onCancel}
                disabled={isAuthLoading}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isAuthLoading}
            >
              {isAuthLoading ? '⏳ Conectando...' : '🔒 Conectar Terminal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
