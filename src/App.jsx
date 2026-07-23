// ============================================================
// src/App.jsx – Router principal
// ============================================================
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Toast from './components/Toast'

import LoginPage        from './pages/LoginPage'
import OperatorSelect   from './pages/OperatorSelect'
import WorkcenterSelect from './pages/WorkcenterSelect'
import OrderList        from './pages/OrderList'
import WorkorderDetail  from './pages/WorkorderDetail'

function RequireAuth({ children }) {
  const { isAuthenticated } = useApp()
  return isAuthenticated ? children : <Navigate to="/" replace />
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Login */}
        <Route path="/" element={<LoginPage />} />

        {/* Rutas protegidas */}
        <Route path="/operator" element={
          <RequireAuth><OperatorSelect /></RequireAuth>
        } />
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
