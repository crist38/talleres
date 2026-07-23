// ============================================================
// src/context/AppContext.jsx
// Estado global: sesión Odoo, workcenter seleccionado, notificaciones
// ============================================================
import { createContext, useContext, useReducer, useCallback } from 'react'
import { authenticate as odooAuth } from '../api/odoo'

const AppContext = createContext(null)

const initialState = {
  // Auth
  isAuthenticated: false,
  uid: null,
  authError: null,
  isAuthLoading: false,
  // Operario seleccionado
  selectedOperator: null,
  // Workcenter seleccionado
  selectedWorkcenter: null,
  // Toast / notificación global
  toast: null // { message, type: 'success'|'error'|'info' }
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
      return { ...initialState }
    case 'SET_OPERATOR':
      return { ...state, selectedOperator: action.operator }
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

  const logout = useCallback(() => dispatch({ type: 'AUTH_LOGOUT' }), [])

  const selectOperator = useCallback((op) =>
    dispatch({ type: 'SET_OPERATOR', operator: op }), [])

  const selectWorkcenter = useCallback((wc) =>
    dispatch({ type: 'SET_WORKCENTER', workcenter: wc }), [])

  const clearWorkcenter = useCallback(() =>
    dispatch({ type: 'CLEAR_WORKCENTER' }), [])

  const showToast = useCallback((message, type = 'info') => {
    dispatch({ type: 'SHOW_TOAST', message, toastType: type })
    setTimeout(() => dispatch({ type: 'HIDE_TOAST' }), 4000)
  }, [])

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      logout,
      selectOperator,
      selectWorkcenter,
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
