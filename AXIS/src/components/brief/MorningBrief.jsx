import { useMemo } from 'react'
import { useNEXUS } from '../../context/NEXUSContext'
import { Sun, ArrowRight, Target, TrendingDown, Sparkles, X } from 'lucide-react'

/**
 * MorningBrief — Banner suave que aparece en FocusMode al inicio del día.
 *
 * Diseñado para reducir decision fatigue al arranque (relevante en TDAH):
 *  - Saludo personal
 *  - Las 3 misiones prioritarias del día
 *  - Sugerencia clara: "empieza por X"
 *  - CTA único: "Abrir Now Mode con X"
 *
 * Se muestra UNA vez por día, sólo entre 5am y 12pm.
 * Persistencia: `axis_last_brief_at` (ISO).
 * Dismiss: marca el día como visto.
 */

const STORAGE_KEY = 'axis_last_brief_at'

const sameDay = (a, b) => {
  const da = new Date(a), db = new Date(b)
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate()
}

const isBriefWindow = () => {
  const h = new Date().getHours()
  return h >= 5 && h < 12
}

const PRIORIDAD_ORDER = { CRITICA: 0, ALTA: 1, NORMAL: 2, BAJA: 3 }

export default function MorningBrief({ onOpenNow }) {
  const { tasks, currentUser, axisMode, insights, keyResults, userPlaybook } = useNEXUS()

  const visible = useMemo(() => {
    if (typeof window === 'undefined') return false
    if (!currentUser) return false
    if (!isBriefWindow()) return false
    try {
      const last = window.localStorage.getItem(STORAGE_KEY)
      if (last && sameDay(last, new Date().toISOString())) return false
    } catch { /* no-op */ }
    return true
  }, [currentUser])

  const top3 = useMemo(() => {
    if (!currentUser) return []
    const scoped = axisMode === 'solo'
      ? tasks.filter(t => t.activoId === currentUser.id)
      : tasks
    return scoped
      .filter(t => t.estado !== 'COMPLETADA')
      .sort((a, b) => {
        const pa = (PRIORIDAD_ORDER[a.prioridad] ?? 9) - (PRIORIDAD_ORDER[b.prioridad] ?? 9)
        if (pa !== 0) return pa
        return new Date(a.fechaLimite) - new Date(b.fechaLimite)
      })
      .slice(0, 3)
  }, [tasks, currentUser, axisMode])

  const krRezagado = useMemo(() => {
    if (!Array.isArray(keyResults) || keyResults.length === 0) return null
    return keyResults
      .slice()
      .sort((a, b) => (a.progresoMetrica ?? 0) - (b.progresoMetrica ?? 0))[0]
  }, [keyResults])

  if (!visible || top3.length === 0) return null

  const sugerido = top3[0]
  const hora = new Date().getHours()
  const saludo = hora < 6 ? 'Madrugaste' : hora < 12 ? 'Buenos días' : 'Hola'
  const nombre = currentUser?.nombre?.split(' ')[0] || currentUser?.codename || ''

  const handleDismiss = () => {
    try { window.localStorage.setItem(STORAGE_KEY, new Date().toISOString()) } catch { /* no-op */ }
    window.dispatchEvent(new CustomEvent('axis:brief:dismissed'))
  }

  const handleOpenNow = () => {
    handleDismiss()
    if (onOpenNow) onOpenNow(sugerido.id)
    else window.dispatchEvent(new CustomEvent('axis:now:open', { detail: { tareaId: sugerido.id } }))
  }

  return (
    <section
      role="region"
      aria-label="Resumen matutino"
      className="surface-elevated mb-4 overflow-hidden"
      style={{ borderColor: 'rgba(91,141,239,0.35)', background: 'linear-gradient(135deg, rgba(91,141,239,0.08), rgba(255,181,71,0.04))' }}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,181,71,0.15)', border: '1px solid rgba(255,181,71,0.40)' }}>
            <Sun className="w-4 h-4" style={{ color: '#FFD27A' }} />
          </div>
          <div>
            <h2 className="text-nexus-text font-bold text-sm">{saludo}{nombre ? `, ${nombre}` : ''}.</h2>
            <p className="text-nexus-muted text-[11px] font-mono">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              {userPlaybook?.nombre ? ` · ${userPlaybook.nombre}` : ''}
            </p>
          </div>
        </div>
        <button onClick={handleDismiss} aria-label="Cerrar brief matutino" className="text-nexus-muted hover:text-nexus-text p-1 rounded hover:bg-nexus-bg/60 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </header>

      <div className="px-4 pb-4">
        <p className="text-nexus-text text-sm mt-3 mb-3 leading-relaxed">
          <Sparkles className="w-3.5 h-3.5 inline-block mr-1 text-blue-300 -mt-0.5" />
          {insights?.energia === 'BAJO'
            ? <>Empieza pequeño. Esta es la palanca de menor fricción para mover algo hoy:</>
            : insights?.sobrecarga === 'ROJO'
              ? <>Hay demasiadas críticas abiertas. Cierra UNA antes de tocar las demás:</>
              : <>Empieza por esta. Una sola, con foco. Las otras esperan:</>
          }
        </p>

        <ul className="space-y-1.5 mb-3">
          {top3.map((t, i) => (
            <li
              key={t.id}
              className={`flex items-start gap-2 p-2 rounded ${i === 0 ? 'bg-blue-900/15 border border-blue-700/40' : ''}`}
            >
              <span className={`text-xs font-mono font-bold w-5 ${i === 0 ? 'text-blue-300' : 'text-nexus-muted'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${i === 0 ? 'text-nexus-text font-semibold' : 'text-nexus-text/85'}`}>
                  {t.titulo}
                </p>
                <p className="text-nexus-muted text-[10px] font-mono mt-0.5">
                  {t.prioridad} · {t.progreso}% · vence {new Date(t.fechaLimite).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {krRezagado && krRezagado.progresoMetrica < 50 && (
          <div className="flex items-center gap-2 text-[11px] text-nexus-muted bg-nexus-bg/40 rounded px-2 py-1.5 mb-3">
            <TrendingDown className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            <span>KR más rezagado: <span className="text-nexus-text">{krRezagado.titulo}</span> ({krRezagado.progresoMetrica ?? 0}%)</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenNow}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded font-semibold text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 0 16px rgba(59,130,246,0.20)' }}
          >
            <Target className="w-4 h-4" />
            Abrir en Now Mode
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDismiss}
            className="px-3 py-2.5 rounded text-xs font-mono text-nexus-muted hover:text-nexus-text border border-nexus-border hover:border-blue-500/50 transition-all"
          >
            Más tarde
          </button>
        </div>
      </div>
    </section>
  )
}
