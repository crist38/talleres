// ============================================================
// src/App.jsx – Router principal
// ============================================================
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Toast from './components/Toast'

import LoginPage        from './pages/LoginPage'
import WorkcenterSelect from './pages/WorkcenterSelect'
import OrderList        from './pages/OrderList'
import WorkorderDetail  from './pages/WorkorderDetail'

function RequireAuth({ children }) {
  const { selectedOperator, isRestoring } = useApp()
  if (isRestoring) return null
  return selectedOperator ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Login con usuario de Odoo */}
        <Route path="/" element={<LoginPage />} />

        {/* Rutas protegidas: requieren sesión Odoo */}
        <Route path="/workcenter" element={
          <RequireAuth><WorkcenterSelect /></RequireAuth>
        } />
        <Route path="/orders" element={
          <RequireAuth><OrderList /></RequireAuth>
        } />
        <Route path="/workorder/:id" element={
          <RequireAuth><WorkorderDetail /></RequireAuth>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast global – siempre visible */}
      <Toast />
    </>
  )
}
