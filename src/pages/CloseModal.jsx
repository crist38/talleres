// ============================================================
// src/pages/CloseModal.jsx
// Modal de cierre: qty producida + mermas por componente
// ============================================================
import { useState } from 'react'
import { finishWorkorder, registerScrap } from '../api/odoo'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { getWorkorderDisplayTitle } from '../utils/formatters'

function Numpad({ onDigit, onDelete, onDecimal }) {
  const btn = (label, action, cls = '') => (
    <button key={label} className={`numpad-btn ${cls}`} onClick={action}>{label}</button>
  )
  return (
    <div className="numpad">
      {['7','8','9','4','5','6','1','2','3'].map(d =>
        btn(d, () => onDigit(d))
      )}
      {btn('⌫', onDelete, 'del')}
      {btn('0', () => onDigit('0'), 'zero')}
      {btn('.', onDecimal)}
    </div>
  )
}

export default function CloseModal({ workorder, onCancel, onSuccess }) {
  const { showToast } = useApp()
  const navigate = useNavigate()
  const [qtyStr, setQtyStr] = useState(String(workorder.qty_remaining ?? workorder.qty_production ?? 0))
  const [scraps, setScraps] = useState(
    workorder.components?.map(c => ({ ...c, scrapQty: '' })) || []
  )
  const [loading, setLoading] = useState(false)

  const handleDigit = (d) =>
    setQtyStr(prev => (prev === '0' ? d : prev + d))
  const handleDelete = () =>
    setQtyStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0')
  const handleDecimal = () =>
    setQtyStr(prev => prev.includes('.') ? prev : prev + '.')

  const handleScrapChange = (idx, val) => {
    setScraps(prev => prev.map((s, i) => i === idx ? { ...s, scrapQty: val } : s))
  }

  const handleConfirm = async () => {
    const qty = parseFloat(qtyStr)
    if (isNaN(qty) || qty < 0) {
      showToast('Ingresa una cantidad válida', 'error')
      return
    }
    setLoading(true)
    try {
      // 1. Finalizar la orden con qty producida
      await finishWorkorder(workorder.id, qty)

      // 2. Registrar mermas (solo las que tienen qty > 0)
      const scrapTasks = scraps
        .filter(s => parseFloat(s.scrapQty) > 0)
        .map(s =>
          registerScrap(
            workorder.production_id?.[0],
            s.product_id?.[0],
            parseFloat(s.scrapQty),
            s.product_uom?.[0] || false
          )
        )
      await Promise.all(scrapTasks)

      showToast(`✅ Orden cerrada — ${qty} unidades registradas`, 'success')
      onSuccess()
    } catch (err) {
      showToast(`Error al cerrar la orden: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">✔ Cerrar Orden de Trabajo</div>
        <div className="modal-subtitle">{workorder.name} — {getWorkorderDisplayTitle(workorder)}</div>

        {/* Cantidad producida */}
        <label className="input-label">Unidades Buenas Producidas</label>
        <div className="qty-display">{qtyStr || '0'}</div>
        <Numpad onDigit={handleDigit} onDelete={handleDelete} onDecimal={handleDecimal} />

        {/* Mermas */}
        {scraps.length > 0 && (
          <>
            <div className="divider" style={{ margin: '28px 0 20px' }} />
            <label className="input-label">Registro de Mermas / Chatarra (opcional)</label>
            {scraps.map((s, idx) => (
              <div key={s.id} className="scrap-row">
                <span className="scrap-product-name">
                  {s.product_id?.[1] || 'Componente'}
                  <span className="text-muted text-sm"> ({s.product_uom?.[1] || ''})</span>
                </span>
                <input
                  id={`scrap-${s.id}`}
                  type="number"
                  className="scrap-input"
                  placeholder="0"
                  min="0"
                  step="any"
                  value={s.scrapQty}
                  onChange={e => handleScrapChange(idx, e.target.value)}
                />
              </div>
            ))}
          </>
        )}

        <div className="modal-actions">
          <button
            id="btn-cancel-close"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-close"
            className="btn btn-success btn-lg"
            onClick={handleConfirm}
            disabled={loading}
            style={{ flex: 2 }}
          >
            {loading ? '⏳ Guardando...' : '✔ Confirmar y Cerrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
