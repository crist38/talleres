// ============================================================
// src/context/AppContext.jsx
// Estado global: sesión Odoo del operario, auto-logout por inactividad
// ============================================================
import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { authenticate as odooAuth, getCurrentSession, logoutSession, SESSION_EXPIRED_EVENT } from '../api/odoo'

const AppContext = createContext(null)

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000 // 3 minutos de inactividad

const initialState = {
  // Restaurando sesión existente al cargar la app
  isRestoring: true,
  authError: null,
  isAuthLoading: false,
  // Usuario de Odoo logueado: { uid, name, login }
  selectedOperator: null,
  // Workcenter seleccionado
  selectedWorkcenter: null,
  // Lista completa de workcenters (para navegación entre talleres PVC)
  workcenters: [],
  // Toast / notificación global
  toast: null
}

function reducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isAuthLoading: true, authError: null }
    case 'AUTH_SUCCESS':
      return { ...state, selectedOperator: action.operator, isRestoring: false, isAuthLoading: false, authError: null }
    case 'AUTH_ERROR':
      return { ...state, selectedOperator: null, isAuthLoading: false, authError: action.error }
    case 'AUTH_LOGOUT':
      return { ...initialState, isRestoring: false }
    case 'RESTORE_DONE':
      return { ...state, isRestoring: false }
    case 'SET_WORKCENTERS':
      return { ...state, workcenters: action.workcenters }
    case 'SET_WORKCENTER':
      return { ...state, selectedWorkcenter: action.workcenter }
    case 'CLEAR_WORKCENTER':
      return { ...state, selectedWorkcenter: null }
    case 'SHOW_TOAST':
      return { ...state, toast: { message: action.message, type: action.toastType || 'info' } }
    case 'HIDE_TOAST':
      return { ...state, toast: null }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const inactivityTimerRef = useRef(null)

  const showToast = useCallback((message, type = 'info') => {
    dispatch({ type: 'SHOW_TOAST', message, toastType: type })
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 4000)
  }, [])

  // ── Restaurar sesión Odoo existente (p. ej. tras recargar la página) ──
  useEffect(() => {
    getCurrentSession().then(session => {
      if (session) dispatch({ type: 'AUTH_SUCCESS', operator: session })
      else dispatch({ type: 'RESTORE_DONE' })
    })
  }, [])

  const login = useCallback(async (user, password) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const operator = await odooAuth(user, password)
      dispatch({ type: 'AUTH_SUCCESS', operator })
      return operator
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR', error: err.message })
      return null
    }
  }, [])

  const logout = useCallback(() => {
    dispatch({ type: 'AUTH_LOGOUT' })
    logoutSession()
  }, [])

  // Sesión Odoo expirada sin posibilidad de renovar → volver al login
  useEffect(() => {
    const onExpired = () => {
      dispatch({ type: 'AUTH_LOGOUT' })
      showToast('🔒 La sesión de Odoo expiró. Ingresa nuevamente.', 'info')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [showToast])

  const selectWorkcenter = useCallback((wc) =>
    dispatch({ type: 'SET_WORKCENTER', workcenter: wc }), [])

  const setWorkcenters = useCallback((list) =>
    dispatch({ type: 'SET_WORKCENTERS', workcenters: list }), [])

  const clearWorkcenter = useCallback(() =>
    dispatch({ type: 'CLEAR_WORKCENTER' }), [])

  // ── Listener de Inactividad ──────────────────────────────────
  useEffect(() => {
    if (!state.selectedOperator) return

    const resetTimer = () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      inactivityTimerRef.current = setTimeout(() => {
        logout()
        showToast('🔒 Sesión cerrada por inactividad', 'info')
      }, INACTIVITY_TIMEOUT_MS)
    }

    const events = ['mousemove', 'touchstart', 'keydown', 'click', 'scroll']
    events.forEach(ev => window.addEventListener(ev, resetTimer))
    resetTimer()

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      events.forEach(ev => window.removeEventListener(ev, resetTimer))
    }
  }, [state.selectedOperator, logout, showToast])

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      logout,
      selectWorkcenter,
      setWorkcenters,
      clearWorkcenter,
      showToast
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
