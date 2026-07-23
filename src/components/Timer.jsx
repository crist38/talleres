// ============================================================
// src/components/Timer.jsx
// Cronómetro en tiempo real que sincroniza con el estado de Odoo
// ============================================================
import { useEffect, useRef, useState } from 'react'

function pad(n) { return String(Math.floor(n)).padStart(2, '0') }

function formatSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/**
 * @param {number}  initialSeconds  – segundos ya registrados en Odoo (duration * 60)
 * @param {boolean} running         – si el cronómetro corre ahora
 */
export default function Timer({ initialSeconds = 0, running = false }) {
  const [elapsed, setElapsed] = useState(initialSeconds)
  const intervalRef = useRef(null)

  useEffect(() => {
    setElapsed(initialSeconds)
  }, [initialSeconds])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const stateClass = running ? 'running' : elapsed > 0 ? 'paused' : ''

  return (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <div className={`timer-display ${stateClass}`}>
        {formatSeconds(elapsed)}
      </div>
      <div style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {running ? '🟢 En progreso' : elapsed > 0 ? '⏸ Pausado' : '⏱ Sin iniciar'}
      </div>
    </div>
  )
}
