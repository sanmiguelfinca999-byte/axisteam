import { useMemo } from 'react'
import { Flame, Calendar, CheckCircle2, TrendingUp } from 'lucide-react'
import { useNEXUS } from '../../../context/NEXUSContext'

/**
 * StreakHUD — vista de calendario para el playbook habits-health.
 *
 * Muestra los últimos 30 días como grid 6 semanas × 5 días (o 5×7).
 * Cada celda con ≥1 misión completada se ilumina. Indica streak actual
 * y la racha más larga en los últimos 90 días.
 *
 * Fuente de "día completado": eventos COMPLETED de la tarea (si existen),
 * con fallback al `fechaLimite` cuando la tarea está COMPLETADA.
 */

const DAYS_GRID = 35     // 5 semanas
const DAYS_LOOKBACK_LONGEST = 90
const MS_DAY = 86_400_000

const toDayKey = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const getCompletionDate = (tarea) => {
  // Prioriza el evento COMPLETED real
  const ev = (tarea.eventos || []).find(e => e.tipo === 'COMPLETED' || e.tipo === 'COMPLETADA')
  if (ev?.timestamp) return new Date(ev.timestamp)
  // Fallback: si está completada, usar fechaLimite (aprox, mejor que nada)
  if (tarea.estado === 'COMPLETADA') return new Date(tarea.fechaLimite)
  return null
}

export default function StreakHUD() {
  const { tasks, currentUser, axisMode, userPlaybook } = useNEXUS()
  const isSolo = axisMode === 'solo'

  const scoped = useMemo(() => {
    if (!isSolo) return tasks
    if (!currentUser) return []
    return tasks.filter(t => t.activoId === currentUser.id)
  }, [tasks, isSolo, currentUser])

  // Mapa día → cantidad de misiones completadas
  const completionsByDay = useMemo(() => {
    const map = {}
    for (const t of scoped) {
      const d = getCompletionDate(t)
      if (!d) continue
      const k = toDayKey(d)
      map[k] = (map[k] || 0) + 1
    }
    return map
  }, [scoped])

  // Grid de los últimos 35 días (oldest → newest)
  const grid = useMemo(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const cells = []
    for (let i = DAYS_GRID - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * MS_DAY)
      const key = toDayKey(d)
      cells.push({
        key,
        date: d,
        count: completionsByDay[key] || 0,
        isToday: i === 0,
      })
    }
    return cells
  }, [completionsByDay])

  // Streak actual (desde hoy hacia atrás)
  const streakActual = useMemo(() => {
    let count = 0
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    // Hoy puede no contar todavía como roto; arrancamos desde hoy
    for (let i = 0; i < DAYS_LOOKBACK_LONGEST; i++) {
      const d = new Date(today.getTime() - i * MS_DAY)
      const k = toDayKey(d)
      if (completionsByDay[k] && completionsByDay[k] > 0) {
        count++
      } else {
        // Si es el día de hoy y aún no hay completion, NO rompemos la racha
        // (el día está abierto). Sí rompemos a partir de ayer.
        if (i === 0) continue
        break
      }
    }
    return count
  }, [completionsByDay])

  // Streak más larga en los últimos 90 días
  const streakMaxima = useMemo(() => {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    let max = 0
    let cur = 0
    for (let i = DAYS_LOOKBACK_LONGEST - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * MS_DAY)
      const k = toDayKey(d)
      if (completionsByDay[k] && completionsByDay[k] > 0) {
        cur++
        if (cur > max) max = cur
      } else {
        cur = 0
      }
    }
    return max
  }, [completionsByDay])

  const totalCompletadas = useMemo(() => scoped.filter(t => t.estado === 'COMPLETADA').length, [scoped])
  const activas = scoped.filter(t => t.estado !== 'COMPLETADA')

  const intensidad = (count) => {
    if (count <= 0) return null
    if (count === 1) return 0.35
    if (count === 2) return 0.55
    if (count === 3) return 0.75
    return 1
  }

  if (scoped.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-nexus-muted text-sm p-8 text-center">
        <div className="max-w-sm">
          <Flame className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-nexus-text mb-1">Aún no hay hábito que medir.</p>
          <p className="text-xs leading-relaxed">Empieza con la versión de 2 minutos que NO puedes fallar. La consistencia se construye desde lo ridículamente pequeño.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 max-w-4xl mx-auto">
      <header className="mb-6">
        <h2 className="text-nexus-text text-lg font-bold tracking-tight">Streak {userPlaybook?.nombre ? <span className="text-nexus-muted font-mono text-sm font-normal ml-2">// {userPlaybook.nombre}</span> : null}</h2>
        <p className="text-nexus-muted text-xs font-mono">{isSolo ? 'Tu racha de hábitos' : 'Racha del equipo'} — últimos {DAYS_GRID} días</p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatBig
          icon={Flame}
          label="Racha actual"
          value={streakActual}
          unit={streakActual === 1 ? 'día' : 'días'}
          accent={streakActual >= 7 ? '#FFB547' : streakActual > 0 ? '#22D3A8' : '#7A8AB8'}
          highlight={streakActual >= 7}
        />
        <StatBig
          icon={TrendingUp}
          label="Racha más larga"
          value={streakMaxima}
          unit={streakMaxima === 1 ? 'día' : 'días'}
          accent="#5B8DEF"
        />
        <StatBig
          icon={CheckCircle2}
          label="Completadas"
          value={totalCompletadas}
          unit={totalCompletadas === 1 ? 'misión' : 'misiones'}
          accent="#22D3A8"
        />
        <StatBig
          icon={Calendar}
          label="Activas"
          value={activas.length}
          unit={activas.length === 1 ? 'misión' : 'misiones'}
          accent="#E8ECFF"
        />
      </div>

      <section className="surface-elevated p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-nexus-text text-sm font-semibold">Últimos {DAYS_GRID} días</h3>
          <Legend />
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {grid.map(cell => {
            const intens = intensidad(cell.count)
            const dia = cell.date.getDate()
            return (
              <div
                key={cell.key}
                className={`aspect-square rounded flex items-center justify-center text-[10px] font-mono transition-all border ${cell.isToday ? 'border-blue-400' : 'border-nexus-border/40'}`}
                style={{
                  background: intens != null
                    ? `rgba(34, 211, 168, ${intens})`
                    : 'rgba(255,255,255,0.02)',
                  color: intens != null && intens > 0.5 ? '#06091F' : '#7A8AB8',
                }}
                title={`${cell.date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} — ${cell.count} misión${cell.count !== 1 ? 'es' : ''}`}
              >
                <span className="font-semibold">{dia}</span>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-nexus-text text-sm font-semibold mb-2">Hábitos activos</h3>
        {activas.length === 0 ? (
          <p className="text-nexus-muted text-xs font-mono">Sin hábitos activos. Define el siguiente.</p>
        ) : (
          <div className="space-y-2">
            {activas.slice(0, 6).map(t => (
              <div key={t.id} className="hud-card p-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-nexus-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-nexus-text text-sm font-medium truncate">{t.titulo}</p>
                  <p className="text-nexus-muted text-[10px] font-mono">{t.progreso}% · {new Date(t.fechaLimite).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatBig({ icon: Icon, label, value, unit, accent, highlight }) {
  return (
    <div className={`hud-card p-3 text-center ${highlight ? 'border-yellow-500/60' : ''}`}>
      <div className="flex items-center justify-center gap-1 text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color: accent }}>{value}</div>
      <div className="text-nexus-muted text-[10px] font-mono">{unit}</div>
    </div>
  )
}

function Legend() {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-nexus-muted">
      <span>menos</span>
      {[0, 0.35, 0.55, 0.75, 1].map((a, i) => (
        <span
          key={i}
          className="w-3 h-3 rounded"
          style={{ background: a === 0 ? 'rgba(255,255,255,0.04)' : `rgba(34,211,168,${a})`, border: '1px solid rgba(255,255,255,0.05)' }}
        />
      ))}
      <span>más</span>
    </div>
  )
}
