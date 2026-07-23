// ============================================================
// src/pages/OperatorSelect.jsx
// Pantalla de selección de operario (quién está en el tablet)
// Carga los empleados desde Odoo y guarda la selección en contexto
// ============================================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { searchRead } from '../api/odoo'
import Topbar from '../components/Topbar'
import OfflineBanner from '../components/OfflineBanner'

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#06b6d4', '#ef4444', '#84cc16'
]

export default function OperatorSelect() {
  const { selectOperator, showToast } = useApp()
  const navigate = useNavigate()
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    searchRead(
      'hr.employee',
      [['active', '=', true]],
      ['id', 'name', 'job_title', 'department_id', 'work_location_name'],
      { order: 'name asc', limit: 50 }
    )
      .then(setEmployees)
      .catch(err => {
        console.warn('No se pudieron cargar empleados:', err.message)
        setEmployees([]) // no bloquear si hr no tiene permisos
        showToast('No se pudieron cargar los empleados de Odoo', 'info')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (emp) => {
    selectOperator(emp)
    navigate('/workcenter')
  }

  return (
    <>
      <OfflineBanner />
      <Topbar />
      <div className="page operator-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">¿Quién está operando?</h1>
            <p className="page-subtitle">Selecciona tu nombre para registrar las horas correctamente</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <span>Cargando operarios...</span>
          </div>
        ) : employees.length === 0 ? (
          // Si no hay empleados o no hay permisos, permitir continuar sin selección
          <div className="empty-state">
            <div className="empty-state-icon">👷</div>
            <div className="empty-state-title">Sin operarios configurados</div>
            <div className="empty-state-desc">
              No se encontraron empleados en Odoo. Puedes continuar de todas formas.
            </div>
            <button
              id="btn-continue-without-operator"
              className="btn btn-primary btn-lg mt-16"
              onClick={() => { selectOperator(null); navigate('/workcenter') }}
            >
              Continuar sin seleccionar →
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {employees.map((emp, idx) => {
              const color = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              return (
                <button
                  key={emp.id}
                  id={`operator-${emp.id}`}
                  className="card card-interactive operator-card"
                  onClick={() => handleSelect(emp)}
                  aria-label={`Seleccionar operario ${emp.name}`}
                >
                  <div
                    className="operator-avatar"
                    style={{ background: `linear-gradient(135deg, ${color}cc, ${color}66)`, borderColor: color }}
                  >
                    {getInitials(emp.name)}
                  </div>
                  <div className="operator-name">{emp.name}</div>
                  {emp.job_title && (
                    <div className="operator-role">{emp.job_title}</div>
                  )}
                  {emp.department_id && (
                    <div className="operator-dept">{emp.department_id[1]}</div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
