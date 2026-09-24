// ============================================================
// src/pages/LoginPage.jsx
// Inicio de sesión con el usuario y contraseña de Odoo del operario
// ============================================================
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import OfflineBanner from '../components/OfflineBanner'

export default function LoginPage() {
  const { login, selectedOperator, isRestoring, isAuthLoading, authError, showToast } = useApp()
  const navigate = useNavigate()

  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')

  if (isRestoring) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <span>Conectando con Odoo...</span>
      </div>
    )
  }

  // Sesión ya activa → directo a la selección de estación
  if (selectedOperator) return <Navigate to="/workcenter" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    const operator = await login(user.trim(), password)
    if (operator) {
      setPassword('')
      showToast(`Bienvenido/a, ${operator.name.split(' ')[0]}`, 'success')
      navigate('/workcenter')
    }
  }

  return (
    <>
      <OfflineBanner />
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <img
              src="/logo-texto.png"
              alt="Prowindows Logo"
              className="kiosk-logo-img"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <h1>Talleres Prowindows</h1>
            <p>Ingresa con tu usuario de Odoo</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {authError && (
              <div className="login-error">⚠️ {authError}</div>
            )}

            <div>
              <label className="input-label" htmlFor="login-user">Usuario / Correo Odoo</label>
              <input
                id="login-user"
                className="login-input"
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                placeholder="usuario@prowindows.cl"
                value={user}
                onChange={e => setUser(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="input-label" htmlFor="login-pass">Contraseña</label>
              <input
                id="login-pass"
                className="login-input"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isAuthLoading}
            >
              {isAuthLoading ? '⏳ Ingresando...' : '🔒 Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
