import { useEffect, useState } from 'react'
import { getCurrentSession, logoutSession, SESSION_EXPIRED_EVENT } from './odoo.js'
import { DATASETS } from './datasets.js'
import Login from './pages/Login.jsx'
import Resumen from './pages/Resumen.jsx'
import DatasetPage from './pages/DatasetPage.jsx'

const TABS = [{ key: 'resumen', label: 'Resumen' }, ...Object.entries(DATASETS).map(([key, ds]) => ({ key, label: ds.label }))]

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function presetRange(preset) {
  const now = new Date()
  switch (preset) {
    case 'hoy': return { from: iso(now), to: iso(now) }
    case '7d': return { from: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)), to: iso(now) }
    case 'mes_anterior': return {
      from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: iso(new Date(now.getFullYear(), now.getMonth(), 0))
    }
    case 'anio': return { from: iso(new Date(now.getFullYear(), 0, 1)), to: iso(now) }
    case 'mes':
    default: return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) }
  }
}

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = verificando sesión
  const [tab, setTab] = useState('resumen')
  const [range, setRange] = useState(() => presetRange('mes'))
  const [preset, setPreset] = useState('mes')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    getCurrentSession().then(setUser)
    const onExpired = () => setUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  if (user === undefined) return <p className="muted pad">Conectando con Odoo…</p>
  if (!user) return <Login onLogin={setUser} />

  const choosePreset = (p) => {
    setPreset(p)
    if (p !== 'custom') setRange(presetRange(p))
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/logo.png" alt="" />
          <span>Panel Prowindows</span>
        </div>
        <div className="user">
          <span>{user.name}</span>
          <button className="btn-secondary" onClick={async () => { await logoutSession(); setUser(null) }}>Salir</button>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map(t => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      <section className="filters">
        <select value={preset} onChange={e => choosePreset(e.target.value)}>
          <option value="hoy">Hoy</option>
          <option value="7d">Últimos 7 días</option>
          <option value="mes">Este mes</option>
          <option value="mes_anterior">Mes anterior</option>
          <option value="anio">Este año</option>
          <option value="custom">Personalizado</option>
        </select>
        <label>Desde <input type="date" value={range.from} onChange={e => { setPreset('custom'); setRange(r => ({ ...r, from: e.target.value })) }} /></label>
        <label>Hasta <input type="date" value={range.to} onChange={e => { setPreset('custom'); setRange(r => ({ ...r, to: e.target.value })) }} /></label>
        <button className="btn-secondary" onClick={() => setReloadKey(k => k + 1)}>Actualizar</button>
      </section>

      <main>
        {tab === 'resumen'
          ? <Resumen range={range} reloadKey={reloadKey} onOpenTab={setTab} />
          : <DatasetPage key={tab} datasetKey={tab} range={range} reloadKey={reloadKey} />}
      </main>
    </div>
  )
}
