import { useEffect, useState } from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'

/**
 * MissionCelebration — Micro-feedback dopaminérgico al completar misión.
 *
 * Escucha el evento global `axis:mission:completed` y muestra una
 * tarjeta flotante con una frase rotativa y auto-dismiss en ~1.8s.
 *
 * Diseño neuro-amigable:
 *   - Tono celebratorio sin estridencia.
 *   - Respeta `prefers-reduced-motion`: sin scale/spring, solo fade.
 *   - No interrumpe flujo (posición fija arriba, no bloqueante).
 *   - Tono adaptado a prioridad (crítica = más fuerte; baja = sutil).
 *
 * El componente se monta una sola vez en App.jsx — no requiere props.
 */

const FRASES = [
  'Bien hecho.',
  'Cerrada.',
  'Una menos.',
  'Progreso real.',
  'Eso cuenta.',
  'Pieza colocada.',
  'Adelante.',
  'Bien.',
]

const PRIORIDAD_BG = {
  CRITICA: 'linear-gradient(135deg, rgba(34,197,94,0.20), rgba(255,84,112,0.10))',
  ALTA:    'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(255,181,71,0.10))',
  NORMAL:  'linear-gradient(135deg, rgba(34,197,94,0.16), rgba(91,141,239,0.08))',
  BAJA:    'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(122,138,184,0.06))',
}

const PRIORIDAD_ACCENT = {
  CRITICA: '#22c55e',
  ALTA:    '#22D3A8',
  NORMAL:  '#5B8DEF',
  BAJA:    '#7A8AB8',
}

function pickFrase() {
  return FRASES[Math.floor(Math.random() * FRASES.length)]
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export default function MissionCelebration() {
  const [event, setEvent] = useState(null) // { titulo, prioridad, frase, accent, id }
  const reduced = prefersReducedMotion()

  useEffect(() => {
    const onCompleted = (e) => {
      const detail = e.detail || {}
      const prioridad = detail.prioridad || 'NORMAL'
      setEvent({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        titulo: detail.titulo || 'Misión',
        prioridad,
        frase: pickFrase(),
        accent: PRIORIDAD_ACCENT[prioridad] || PRIORIDAD_ACCENT.NORMAL,
        bg: PRIORIDAD_BG[prioridad] || PRIORIDAD_BG.NORMAL,
      })
    }
    window.addEventListener('axis:mission:completed', onCompleted)
    return () => window.removeEventListener('axis:mission:completed', onCompleted)
  }, [])

  useEffect(() => {
    if (!event) return
    const timer = setTimeout(() => setEvent(null), 1800)
    return () => clearTimeout(timer)
  }, [event])

  if (!event) return null

  const animClass = reduced ? 'celebration-fade' : 'celebration-pop'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-16 left-1/2 z-50 pointer-events-none ${animClass}`}
      style={{
        transform: 'translateX(-50%)',
        minWidth: 240,
        maxWidth: 420,
      }}
      key={event.id}
    >
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl"
        style={{
          background: event.bg,
          border: `1px solid ${event.accent}66`,
          boxShadow: `0 8px 32px ${event.accent}33`,
          backdropFilter: 'blur(12px) saturate(140%)',
        }}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${event.accent}22`, border: `1px solid ${event.accent}88` }}
        >
          <CheckCircle2 className="w-5 h-5" style={{ color: event.accent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Sparkles className="w-3 h-3" style={{ color: event.accent }} />
            <span className="text-nexus-text font-bold text-sm">{event.frase}</span>
          </div>
          <p className="text-nexus-muted text-xs truncate">{event.titulo}</p>
        </div>
      </div>
    </div>
  )
}
