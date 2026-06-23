import { useEffect, useMemo } from 'react'
import { useNEXUS } from '../../context/NEXUSContext'
import {
  X, CheckCircle2, ArrowRight, Target, Sparkles,
} from 'lucide-react'
import TimeBox from './TimeBox'
import { useFocusTrap } from '../../hooks/useFocusTrap'

/**
 * NowMode — Vista de foco profundo de UNA sola misión.
 *
 * Diseñado para perfiles con TDAH y para cualquiera que necesite
 * romper la inercia inicial. Principios:
 *   - Solo UNA cosa visible. Sin grids ni listas.
 *   - CTA único: marcar como completada.
 *   - TimeBox con escala variable (Pomodoro / día / semana / custom).
 *   - ESC sale suavemente.
 *   - Lenguaje compasivo en cierres y fallback.
 *
 * Al completar, dispara `axis:mission:completed` con detalle para
 * que el listener global de celebración micro lo recoja.
 */

const PRIORIDAD_COLOR = {
  CRITICA: '#FF5470',
  ALTA: '#FFB547',
  NORMAL: '#5B8DEF',
  BAJA: '#7A8AB8',
}

function pickFocusMission(scoped) {
  const activas = scoped.filter(t => t.estado !== 'COMPLETADA')
  if (activas.length === 0) return null
  const critica = activas.find(t => t.prioridad === 'CRITICA')
  if (critica) return critica
  const alta = activas
    .filter(t => t.prioridad === 'ALTA')
    .sort((a, b) => (a.progreso ?? 0) - (b.progreso ?? 0))[0]
  if (alta) return alta
  return activas[0]
}

export default function NowMode({ tareaId = null, onClose = null }) {
  const { tasks, currentUser, axisMode, completarTarea, actualizarProgreso } = useNEXUS()

  const scoped = useMemo(() => {
    if (!currentUser) return []
    if (axisMode === 'solo') return tasks.filter(t => t.activoId === currentUser.id)
    return tasks
  }, [tasks, currentUser, axisMode])

  const focus = useMemo(() => {
    if (tareaId) return scoped.find(t => t.id === tareaId) || pickFocusMission(scoped)
    return pickFocusMission(scoped)
  }, [scoped, tareaId])

  useEffect(() => {
    if (!onClose) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!focus) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ background: 'radial-gradient(circle at center, #0D1438, #06091F)' }}>
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,211,168,0.10)', border: '1px solid rgba(34,211,168,0.30)' }}>
            <Sparkles className="w-7 h-7" style={{ color: '#22D3A8' }} />
          </div>
          <h1 className="text-nexus-text text-2xl font-bold mb-2">No hay misión que enfocar</h1>
          <p className="text-nexus-muted text-sm leading-relaxed mb-6">
            Espacio limpio. Cuando estés listo, define la siguiente acción. No hay prisa.
          </p>
          {onClose && (
            <button onClick={onClose} className="px-5 py-2.5 rounded-md text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
              Volver
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <NowFocusCanvas focus={focus} onClose={onClose} onComplete={completarTarea} onProgress={actualizarProgreso} />
  )
}

function NowFocusCanvas({ focus, onClose, onComplete, onProgress }) {
  const accent = PRIORIDAD_COLOR[focus.prioridad] || PRIORIDAD_COLOR.NORMAL
  const trapRef = useFocusTrap(true)

  const handleComplete = () => {
    onComplete(focus.id)
    // Dispara celebración micro global
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('axis:mission:completed', {
        detail: { tareaId: focus.id, titulo: focus.titulo, prioridad: focus.prioridad },
      }))
    }
    if (onClose) setTimeout(onClose, 600)
  }

  const handleAdvance = (delta) => {
    const next = Math.min(100, Math.max(0, (focus.progreso ?? 0) + delta))
    onProgress(focus.id, next)
  }

  return (
    <div ref={trapRef} role="dialog" aria-modal="true" aria-label="Now Mode" className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'radial-gradient(circle at center, #0D1438, #06091F)' }}>
      <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-3" style={{ background: 'linear-gradient(180deg, rgba(6,9,31,0.85), transparent)' }}>
        <div className="flex items-center gap-2 text-nexus-muted text-xs font-mono uppercase tracking-widest">
          <Target className="w-3.5 h-3.5" />
          Now Mode
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Salir de Now Mode (ESC)" className="text-nexus-muted hover:text-nexus-text p-2 rounded hover:bg-nexus-bg/60 transition-colors flex items-center gap-1 text-xs font-mono">
            <X className="w-4 h-4" /> <span className="hidden sm:inline">ESC</span>
          </button>
        )}
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 md:py-20">
        {/* Pill prioridad */}
        <div className="flex items-center gap-2 mb-6">
          <span
            className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full"
            style={{ background: `${accent}1f`, color: accent, border: `1px solid ${accent}55` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            {focus.prioridad}
          </span>
          <span className="text-nexus-muted text-[10px] font-mono">
            Vence: {new Date(focus.fechaLimite).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
        </div>

        <h1 className="text-nexus-text text-3xl md:text-4xl font-bold leading-tight mb-4">
          {focus.titulo}
        </h1>
        {focus.descripcion && (
          <p className="text-nexus-text/80 text-base leading-relaxed mb-8 max-w-xl">
            {focus.descripcion}
          </p>
        )}

        {/* Progreso visual */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest">Progreso</span>
            <span className="text-nexus-text font-bold text-2xl font-mono" aria-live="polite">{focus.progreso ?? 0}%</span>
          </div>
          <div className="w-full bg-nexus-bg/60 rounded-full h-3 overflow-hidden">
            <div className="h-3 rounded-full transition-all duration-500" style={{ width: `${focus.progreso ?? 0}%`, background: `linear-gradient(90deg, ${accent}, ${accent}cc)` }} />
          </div>
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => handleAdvance(-10)}
              className="text-xs font-mono text-nexus-muted hover:text-nexus-text px-3 py-1.5 rounded border border-nexus-border hover:border-blue-500/50 transition-colors"
            >
              -10%
            </button>
            <button
              onClick={() => handleAdvance(+10)}
              className="text-xs font-mono text-nexus-muted hover:text-nexus-text px-3 py-1.5 rounded border border-nexus-border hover:border-blue-500/50 transition-colors"
            >
              +10%
            </button>
            <button
              onClick={() => handleAdvance(+25)}
              className="text-xs font-mono text-blue-300 hover:text-blue-200 px-3 py-1.5 rounded border border-blue-500/40 hover:border-blue-500/70 transition-colors"
            >
              +25%
            </button>
          </div>
        </section>

        {/* TimeBox flexible — Pomodoro / Hoy / Semana / Custom */}
        <div className="mb-8">
          <TimeBox />
        </div>

        {/* CTA — completar */}
        <section>
          <button
            onClick={handleComplete}
            className="w-full py-4 rounded-lg text-white font-bold text-base transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow: '0 0 24px rgba(34,197,94,0.20)' }}
          >
            <CheckCircle2 className="w-5 h-5" />
            Marcar como completada
          </button>
          <p className="text-nexus-muted text-[11px] text-center mt-3 leading-relaxed">
            Si la misión sigue viva mañana, sin culpa. Cierra la sesión y vuelve cuando puedas.
          </p>
        </section>
      </main>

      {onClose && (
        <footer className="max-w-2xl mx-auto px-6 pb-10 text-center">
          <button onClick={onClose} className="text-nexus-muted hover:text-nexus-text text-xs font-mono inline-flex items-center gap-1">
            Volver al sistema completo <ArrowRight className="w-3 h-3" />
          </button>
        </footer>
      )}
    </div>
  )
}
