// ============================================================
// src/components/Toast.jsx
// ============================================================
import { useApp } from '../context/AppContext'

export default function Toast() {
  const { toast } = useApp()
  if (!toast) return null

  const icons = { success: '✅', error: '❌', info: 'ℹ️' }

  return (
    <div className="toast-container">
      <div className={`toast ${toast.type}`}>
        <span>{icons[toast.type] || 'ℹ️'}</span>
        <span>{toast.message}</span>
      </div>
    </div>
  )
}
