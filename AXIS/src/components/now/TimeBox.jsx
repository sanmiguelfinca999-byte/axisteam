import { useEffect, useRef, useState } from 'react'
import { Clock, Play, Pause, RotateCcw, Calendar, CalendarDays, Sun, Coffee, Sparkles } from 'lucide-react'
import {
  MODES,
  targetMillis,
  elapsedAndRemaining,
  formatRemaining,
  modeLabel,
  modeHint,
  isValidCommitment,
} from '../../lib/timeBox'

/**
 * TimeBox — compromiso temporal con escala variable.
 *
 * Modos:
 *   - Pomodoro: 25 / 45 / 90 min con countdown
 *   - Today:    hasta medianoche local
 *   - Week:     hasta domingo 23:59
 *   - Custom:   minutos definidos por el usuario
 *
 * Persiste en localStorage por key (default `axis_focus_commitment`)
 * para sobrevivir refrescos.
 *
 * Cuando el modo es Pomodoro/Custom el usuario puede pausar/reset.
 * Los modos Today/Week son commitments visuales (no se pausan, solo se cierran).
 */

const STORAGE_KEY = 'axis_focus_commitment'

const POMODORO_OPTIONS = [
  { minutes: 25, label: '25 min', hint: 'Pomodoro clásico' },
  { minutes: 45, label: '45 min', hint: 'Sesión media' },
  { minutes: 90, label: '90 min', hint: 'Deep Work block' },
]

const MODE_ICONS = {
  [MODES.POMODORO]: Coffee,
  [MODES.TODAY]:    Sun,
  [MODES.WEEK]:     CalendarDays,
  [MODES.CUSTOM]:   Sparkles,
}

function readSaved() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    // Validación estricta — si el shape o valores son inválidos, descartar
    if (!isValidCommitment(parsed)) return null
    return parsed
  } catch { return null }
}

function persist(commitment) {
  if (typeof window === 'undefined') return
  try {
    if (commitment) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(commitment))
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch { /* no-op */ }
}

export default function TimeBox() {
  // commitment = { mode, param, startedAt, paused?, pausedAt?, tareaId? } o null
  const [commitment, setCommitment] = useState(() => readSaved())
  const [now, setNow] = useState(Date.now())
  const [customMin, setCustomMin] = useState(50)
  const tickRef = useRef(null)

  // Tick activo solo cuando hay commitment y no está pausado
  useEffect(() => {
    if (!commitment || commitment.paused) {
      clearInterval(tickRef.current)
      return
    }
    tickRef.current = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tickRef.current)
  }, [commitment])

  useEffect(() => { persist(commitment) }, [commitment])

  const start = (mode, param = null) => {
    setCommitment({ mode, param, startedAt: Date.now() })
    setNow(Date.now())
  }
  const reset = () => setCommitment(null)
  const togglePause = () => {
    if (!commitment) return
    if (commitment.paused) {
      // Reanudar: ajustamos startedAt sumando el tiempo de pausa
      const pauseMs = Date.now() - (commitment.pausedAt || Date.now())
      setCommitment(c => ({ ...c, paused: false, pausedAt: undefined, startedAt: c.startedAt + pauseMs }))
    } else {
      setCommitment(c => ({ ...c, paused: true, pausedAt: Date.now() }))
    }
  }

  // Sin commitment → selector de modo
  if (!commitment) {
    return (
      <section className="surface-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-nexus-text text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-300" /> Compromiso temporal
          </h2>
        </div>

        <p className="text-nexus-muted text-xs mb-3">
          Elige una escala. Pomodoro para foco corto; día o semana para un compromiso de mayor horizonte.
        </p>

        {/* Pomodoro */}
        <div className="mb-3">
          <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-1.5">Sesión corta</div>
          <div className="grid grid-cols-3 gap-2">
            {POMODORO_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => start(MODES.POMODORO, opt.minutes)}
                className="p-3 rounded-lg border border-nexus-border hover:border-blue-500/60 hover:bg-blue-900/20 transition-all text-center"
              >
                <div className="text-nexus-text font-mono font-bold">{opt.label}</div>
                <div className="text-nexus-muted text-[10px] font-mono mt-0.5">{opt.hint}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Today / Week */}
        <div className="mb-3">
          <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-1.5">Compromiso largo</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => start(MODES.TODAY)}
              className="p-3 rounded-lg border border-nexus-border hover:border-yellow-500/60 hover:bg-yellow-900/15 transition-all text-center"
            >
              <div className="flex items-center justify-center gap-1.5 text-nexus-text font-mono font-bold">
                <Sun className="w-3.5 h-3.5 text-yellow-300" /> Hoy
              </div>
              <div className="text-nexus-muted text-[10px] font-mono mt-0.5">Hasta medianoche</div>
            </button>
            <button
              onClick={() => start(MODES.WEEK)}
              className="p-3 rounded-lg border border-nexus-border hover:border-purple-500/60 hover:bg-purple-900/15 transition-all text-center"
            >
              <div className="flex items-center justify-center gap-1.5 text-nexus-text font-mono font-bold">
                <CalendarDays className="w-3.5 h-3.5 text-purple-300" /> Esta semana
              </div>
              <div className="text-nexus-muted text-[10px] font-mono mt-0.5">Hasta domingo</div>
            </button>
          </div>
        </div>

        {/* Custom */}
        <div>
          <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-1.5">Bloque personalizado</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={600}
              value={customMin}
              onChange={e => setCustomMin(Math.max(1, Math.min(600, Number(e.target.value) || 1)))}
              aria-label="Duración personalizada en minutos"
              className="w-20 bg-nexus-bg border border-nexus-border rounded py-1.5 px-2 text-nexus-text text-sm text-center font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-nexus-muted text-xs font-mono">min</span>
            <button
              onClick={() => start(MODES.CUSTOM, customMin)}
              className="ml-auto px-3 py-1.5 rounded text-xs font-mono font-semibold border border-blue-500/60 text-blue-300 hover:bg-blue-900/30 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3" /> Iniciar
            </button>
          </div>
        </div>
      </section>
    )
  }

  // Con commitment activo
  const r = elapsedAndRemaining(commitment.mode, commitment.startedAt, commitment.param, now)
  const Icon = MODE_ICONS[commitment.mode] || Clock
  const isShort = commitment.mode === MODES.POMODORO || commitment.mode === MODES.CUSTOM
  const target = new Date(targetMillis(commitment.mode, commitment.startedAt, commitment.param))

  // Color por modo + finished
  const accent = r.finished
    ? '#22D3A8'
    : commitment.mode === MODES.WEEK ? '#A78BFA'
      : commitment.mode === MODES.TODAY ? '#FFD27A'
        : '#5B8DEF'

  return (
    <section className="surface-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-nexus-text text-sm font-semibold flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: accent }} />
          {modeLabel(commitment.mode)}
        </h2>
        <button onClick={reset} className="text-nexus-muted hover:text-nexus-text text-xs font-mono flex items-center gap-1" aria-label="Cerrar compromiso temporal">
          <RotateCcw className="w-3 h-3" /> Cerrar
        </button>
      </div>

      <p className="text-nexus-muted text-[11px] mb-3">{modeHint(commitment.mode)}</p>

      <div className="text-center">
        <div
          className="font-bold font-mono mb-2"
          style={{
            color: accent,
            fontSize: isShort ? '3rem' : '2.25rem',
            lineHeight: 1.05,
            opacity: commitment.paused ? 0.55 : 1,
          }}
          aria-live="polite"
        >
          {formatRemaining(r.remainingMs)}
        </div>
        <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest">
          {r.finished
            ? 'Compromiso completado'
            : commitment.mode === MODES.TODAY
              ? `cierre del día a las 23:59`
              : commitment.mode === MODES.WEEK
                ? `cierre de la semana — ${target.toLocaleDateString('es-MX', { weekday: 'long' })} 23:59`
                : commitment.paused
                  ? 'pausado'
                  : `objetivo ${commitment.param ?? '—'} min`}
        </div>
      </div>

      {/* Barra de progreso temporal */}
      <div className="mt-3 w-full bg-nexus-bg/60 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${r.pct}%`, background: accent }}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        {isShort && !r.finished && (
          <button
            onClick={togglePause}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-mono font-semibold border border-blue-500/60 text-blue-300 hover:bg-blue-900/30 transition-colors"
          >
            {commitment.paused ? <><Play className="w-3.5 h-3.5" /> Reanudar</> : <><Pause className="w-3.5 h-3.5" /> Pausar</>}
          </button>
        )}
        {r.finished && (
          <div className="text-xs font-mono text-nexus-green flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5" /> Buen trabajo. Hidratación + estiramiento.
          </div>
        )}
        {commitment.mode === MODES.TODAY && !r.finished && (
          <div className="text-xs font-mono text-yellow-300/80 flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Hoy comprometido en esta misión
          </div>
        )}
        {commitment.mode === MODES.WEEK && !r.finished && (
          <div className="text-xs font-mono text-purple-300/80 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" /> Esta semana, foco aquí
          </div>
        )}
      </div>
    </section>
  )
}
