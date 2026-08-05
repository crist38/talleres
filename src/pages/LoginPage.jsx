// ============================================================
// src/pages/LoginPage.jsx
// Pantalla Kiosco de Inicio de Sesión: Cuadrícula de Empleados
// ============================================================
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getEmployeesList } from '../api/odoo'
import OfflineBanner from '../components/OfflineBanner'

function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'OP'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Colores distintivos de avatar para cada tarjeta
const AVATAR_COLORS = [
  '#2563eb', // Azul (CC)
  '#7c3aed', // Púrpura (CP)
  '#db2777', // Magenta (CT)
  '#d97706', // Ámbar (DP)
  '#059669', // Verde (WR)
  '#0891b2', // Cían
  '#ea580c', // Naranja
  '#65a30d', // Lima
]

export default function LoginPage() {
  const { selectOperator, showToast, isAuthLoading } = useApp()
  const navigate = useNavigate()

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  useEffect(() => {
    setLoading(true)
    getEmployeesList()
      .then(list => {
        setEmployees(list || [])
      })
      .catch(err => {
        console.warn('Error cargando empleados Odoo:', err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCardClick = (emp) => {
    setSelectedEmp(emp)
    setPin('')
    setPinError(false)
  }

  const handleNumpadDigit = (digit) => {
    if (pin.length < 6) {
      const nextPin = pin + digit
      setPin(nextPin)
      setPinError(false)
      // Validar automáticamente al llegar a 4 dígitos si corresponde
      if (nextPin.length === 4) {
        verifyPin(selectedEmp, nextPin)
      }
    }
  }

  const handleNumpadDelete = () => {
    setPin(prev => prev.slice(0, -1))
    setPinError(false)
  }

  const DEFAULT_PIN = '2115'

  const verifyPin = (emp, enteredPin) => {
    // PIN 2115 asignado para todos los usuarios
    const expectedPin = emp.pin ? String(emp.pin).trim() : DEFAULT_PIN

    if (enteredPin !== expectedPin && enteredPin !== DEFAULT_PIN) {
      setPinError(true)
      showToast('PIN incorrecto. Intenta nuevamente.', 'error')
      setTimeout(() => setPin(''), 600)
      return
    }

    // PIN correcto
    selectOperator(emp)
    showToast(`Bienvenido/a, ${emp.name.split(' ')[0]}`, 'success')
    setSelectedEmp(null)
    navigate('/workcenter')
  }

  return (
    <>
      <OfflineBanner />
      <div className="page kiosk-page">
        {/* Encabezado Kiosco */}
        <div className="kiosk-header">
          <div className="kiosk-logo-wrap">
            <img
              src="/logo-texto.png"
              alt="Prowindows Logo"
              className="kiosk-logo-img"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <h1 className="kiosk-title">Talleres Prowindows</h1>
            <p className="kiosk-subtitle">Selecciona tu usuario para ingresar al terminal de planta</p>
          </div>
        </div>

        {/* Cuadrícula de Empleados */}
        {loading || isAuthLoading ? (
          <div className="loading-center" style={{ minHeight: 300 }}>
            <div className="spinner" />
            <span>Cargando empleados de planta...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="empty-state mt-24">
            <div className="empty-state-icon">👷</div>
            <div className="empty-state-title">Sin empleados activos</div>
            <div className="empty-state-desc">
              No se encontraron registros de empleados en Odoo. Verifica tu conexión.
            </div>
            <button
              className="btn btn-primary mt-16"
              onClick={() => {
                selectOperator({ id: 0, name: 'Operario Planta' })
                navigate('/workcenter')
              }}
            >
              Ingresar como Operario Genérico →
            </button>
          </div>
        ) : (
          <div className="kiosk-grid">
            {employees.map((emp, idx) => {
              const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]
              const deptName = Array.isArray(emp.department_id) ? emp.department_id[1] : ''
              const jobTitle = emp.job_title || ''

              return (
                <button
                  key={emp.id}
                  id={`kiosk-emp-${emp.id}`}
                  className="kiosk-card"
                  onClick={() => handleCardClick(emp)}
                  aria-label={`Ingresar como ${emp.name}`}
                >
                  <div
                    className="kiosk-avatar"
                    style={{ background: avatarColor }}
                  >
                    {getInitials(emp.name)}
                  </div>

                  <div className="kiosk-emp-name">{emp.name}</div>
                  
                  {jobTitle && (
                    <div className="kiosk-emp-role">{jobTitle}</div>
                  )}

                  {deptName && (
                    <div className="kiosk-emp-dept">{deptName}</div>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Modal de PIN Numérico */}
        {selectedEmp && (
          <div className="modal-backdrop" onClick={() => setSelectedEmp(null)}>
            <div className="modal kiosk-pin-modal" onClick={e => e.stopPropagation()}>
              <div className="kiosk-pin-header">
                <div
                  className="kiosk-avatar modal-avatar"
                  style={{
                    background: AVATAR_COLORS[employees.findIndex(e => e.id === selectedEmp.id) % AVATAR_COLORS.length]
                  }}
                >
                  {getInitials(selectedEmp.name)}
                </div>
                <h3>{selectedEmp.name}</h3>
                <p className="text-muted text-sm">{selectedEmp.job_title || 'Operario de Planta'}</p>
              </div>

              <div className="kiosk-pin-prompt">Ingresa tu PIN de acceso</div>

              {/* Indicador de Dígitos PIN */}
              <div className={`kiosk-pin-dots ${pinError ? 'error' : ''}`}>
                {[0, 1, 2, 3].map(i => (
                  <span
                    key={i}
                    className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
                  />
                ))}
              </div>

              {/* Teclado Numérico Numpad */}
              <div className="kiosk-numpad">
                {['1','2','3','4','5','6','7','8','9'].map(num => (
                  <button
                    key={num}
                    type="button"
                    className="kiosk-num-btn"
                    onClick={() => handleNumpadDigit(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  className="kiosk-num-btn btn-cancel"
                  onClick={() => setSelectedEmp(null)}
                >
                  ✕
                </button>
                <button
                  type="button"
                  className="kiosk-num-btn"
                  onClick={() => handleNumpadDigit('0')}
                >
                  0
                </button>
                <button
                  type="button"
                  className="kiosk-num-btn btn-del"
                  onClick={handleNumpadDelete}
                >
                  ⌫
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
