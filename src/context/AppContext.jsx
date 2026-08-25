// ============================================================
// src/context/AppContext.jsx
// Estado global: sesión Odoo, operario Kiosco, auto-logout por inactividad
// ============================================================
import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { authenticate as odooAuth, ensureAuthenticated } from '../api/odoo'

const AppContext = createContext(null)

const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000 // 3 minutos de inactividad

const initialState = {
  // Auth sistema
  isAuthenticated: false,
  uid: null,
  authError: null,
  isAuthLoading: false,
  // Operario Kiosco seleccionado
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
      return { ...state, isAuthenticated: true, uid: action.uid, isAuthLoading: false, authError: null }
    case 'AUTH_ERROR':
      return { ...state, isAuthenticated: false, isAuthLoading: false, authError: action.error }
    case 'AUTH_LOGOUT':
      return { ...initialState, isAuthenticated: state.isAuthenticated, uid: state.uid }
    case 'SET_OPERATOR':
      return { ...state, selectedOperator: action.operator }
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

  // ── Auto-autenticación inicial del sistema Odoo ───────────────
  useEffect(() => {
    dispatch({ type: 'AUTH_START' })
    ensureAuthenticated()
      .then(uid => dispatch({ type: 'AUTH_SUCCESS', uid }))
      .catch(err => {
        console.warn('Auto-auth Odoo:', err.message)
        dispatch({ type: 'AUTH_ERROR', error: err.message })
      })
  }, [])

  const login = useCallback(async (db, user, password) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const result = await odooAuth(db, user, password)
      dispatch({ type: 'AUTH_SUCCESS', uid: result.uid })
      return true
    } catch (err) {
      dispatch({ type: 'AUTH_ERROR', error: err.message })
      return false
    }
  }, [])

  const logout = useCallback(() => {
    dispatch({ type: 'SET_OPERATOR', operator: null })
    dispatch({ type: 'CLEAR_WORKCENTER' })
  }, [])

  const selectOperator = useCallback((op) =>
    dispatch({ type: 'SET_OPERATOR', operator: op }), [])

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
      selectOperator,
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
