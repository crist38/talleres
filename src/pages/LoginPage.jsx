// ============================================================
// src/pages/LoginPage.jsx
// ============================================================
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function LoginPage() {
  const { login, isAuthLoading, authError } = useApp()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    user:     import.meta.env.VITE_ODOO_USER     || '',
    password: import.meta.env.VITE_ODOO_PASSWORD || ''
  })

  const dbName = import.meta.env.VITE_ODOO_DB || 'prowindows-ltda'

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await login(dbName, form.user, form.password)
    if (success) navigate('/operator')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">⚙️</div>
          <h1>Talleres Prowindows</h1>
          <p>Interfaz de Fabricación · Odoo 19</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {authError && (
            <div className="login-error">⚠️ {authError}</div>
          )}

          <div>
            <label className="input-label" htmlFor="user">Usuario / Nombre</label>
            <input
              id="user"
              name="user"
              className="login-input"
              type="text"
              placeholder="Ingresa tu usuario"
              value={form.user}
              onChange={handleChange}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="input-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              className="login-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            id="btn-login"
            className="btn btn-primary btn-lg w-full"
            disabled={isAuthLoading}
            style={{ marginTop: 8 }}
          >
            {isAuthLoading ? '⏳ Conectando...' : '🔓 Ingresar al sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}
