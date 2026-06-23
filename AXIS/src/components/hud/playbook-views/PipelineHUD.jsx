import { useMemo } from 'react'
import { CheckCircle, Compass, MessageSquare, Handshake, Trophy, Target, AlertTriangle } from 'lucide-react'
import { useNEXUS } from '../../../context/NEXUSContext'

/**
 * PipelineHUD — vista de columnas para el playbook founder-business.
 *
 * Metáfora: las misiones son "tratos" en un funnel de adquisición.
 *   Discovery → Demo → Trial → Cliente → (Ganadas)
 *
 * Mapeo task → etapa por progreso (0 / 1-34 / 35-69 / 70-99 / 100%).
 * En Squad Mode agrega misiones de TODO el equipo; en Solo Mode solo las del usuario.
 */

const ETAPAS = [
  { id: 'discovery', label: 'Discovery',  icon: Compass,    color: 'rgb(99,102,241)',  hint: 'sin movimiento aún' },
  { id: 'demo',      label: 'Demo',       icon: MessageSquare, color: 'rgb(59,130,246)', hint: 'primer contacto / qualifying' },
  { id: 'trial',     label: 'Trial',      icon: Handshake,  color: 'rgb(245,158,11)', hint: 'en validación' },
  { id: 'cliente',   label: 'Cierre',     icon: Target,     color: 'rgb(244,114,182)', hint: 'cerca de convertir' },
  { id: 'ganadas',   label: 'Ganadas',    icon: Trophy,     color: 'rgb(34,197,94)',  hint: 'completadas' },
]

const etapaDeTarea = (t) => {
  if (t.estado === 'COMPLETADA') return 'ganadas'
  const p = t.progreso ?? 0
  if (p <= 0)   return 'discovery'
  if (p <= 34)  return 'demo'
  if (p <= 69)  return 'trial'
  return 'cliente'
}

function MiniMisionCard({ tarea, owner }) {
  const vencida = new Date(tarea.fechaLimite) < new Date() && tarea.estado !== 'COMPLETADA'
  const dueLabel = new Date(tarea.fechaLimite).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  return (
    <div
      className={`hud-card border p-2.5 mb-2 transition-all hover:border-blue-500/60 ${tarea.prioridad === 'CRITICA' ? 'border-red-600/60' : tarea.prioridad === 'ALTA' ? 'border-yellow-600/60' : 'border-nexus-border'}`}
      title={tarea.descripcion}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-nexus-text text-xs font-medium leading-snug truncate flex-1">{tarea.titulo}</p>
        {tarea.prioridad === 'CRITICA' && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />}
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-nexus-muted gap-2">
        <span className="truncate">{owner?.codename || '—'}</span>
        <span className="flex items-center gap-1 flex-shrink-0">
          <span className={`${vencida ? 'text-red-400' : ''}`}>{dueLabel}</span>
          <span className="text-nexus-text/80 font-semibold">{tarea.progreso}%</span>
        </span>
      </div>
      <div className="mt-1 w-full bg-nexus-bg rounded-full h-0.5">
        <div
          className="h-0.5 rounded-full transition-all"
          style={{
            width: `${tarea.progreso}%`,
            background: tarea.prioridad === 'CRITICA' ? '#ef4444' : tarea.prioridad === 'ALTA' ? '#f59e0b' : '#3b82f6',
          }}
        />
      </div>
    </div>
  )
}

function Columna({ etapa, tareas, ownerOf }) {
  const Icon = etapa.icon
  const total = tareas.length
  return (
    <div className="flex-1 min-w-[200px] flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon className="w-4 h-4" style={{ color: etapa.color }} />
        <h3 className="text-nexus-text text-sm font-semibold tracking-wide">{etapa.label}</h3>
        <span className="ml-auto text-[10px] font-mono text-nexus-muted bg-nexus-bg/60 border border-nexus-border px-1.5 py-0.5 rounded">{total}</span>
      </div>
      <p className="text-nexus-muted text-[10px] font-mono mb-2 px-1 truncate">{etapa.hint}</p>
      <div
        className="flex-1 rounded-lg border border-dashed border-nexus-border/60 p-2 min-h-[120px]"
        style={{ background: `linear-gradient(180deg, ${etapa.color.replace('rgb', 'rgba').replace(')', ',0.05)')}, transparent 70%)` }}
      >
        {tareas.length === 0 ? (
          <div className="h-full flex items-center justify-center text-nexus-muted/60 text-[10px] font-mono uppercase tracking-wider">vacío</div>
        ) : (
          tareas.map(t => <MiniMisionCard key={t.id} tarea={t} owner={ownerOf(t.activoId)} />)
        )}
      </div>
    </div>
  )
}

export default function PipelineHUD() {
  const { tasks, currentUser, axisMode, sprintActivo, metricas, ACTIVOS_CREDENTIALS, userPlaybook } = useNEXUS()
  const isSolo = axisMode === 'solo'

  const ownerOf = (id) => ACTIVOS_CREDENTIALS.find(a => a.id === id) || (currentUser?.id === id ? currentUser : null)

  const scoped = useMemo(() => {
    if (!isSolo) return tasks
    if (!currentUser) return []
    return tasks.filter(t => t.activoId === currentUser.id)
  }, [tasks, isSolo, currentUser])

  const porEtapa = useMemo(() => {
    const map = Object.fromEntries(ETAPAS.map(e => [e.id, []]))
    for (const t of scoped) map[etapaDeTarea(t)].push(t)
    // Ordenar dentro de cada columna: críticas primero, luego por fechaLimite
    const prio = { CRITICA: 0, ALTA: 1, NORMAL: 2, BAJA: 3 }
    for (const id of Object.keys(map)) {
      map[id].sort((a, b) => {
        const pa = (prio[a.prioridad] ?? 9) - (prio[b.prioridad] ?? 9)
        if (pa !== 0) return pa
        return new Date(a.fechaLimite) - new Date(b.fechaLimite)
      })
    }
    return map
  }, [scoped])

  const totales = useMemo(() => ({
    total: scoped.length,
    activas: scoped.filter(t => t.estado !== 'COMPLETADA').length,
    cerca: porEtapa.cliente.length,
    ganadas: porEtapa.ganadas.length,
  }), [scoped, porEtapa])

  if (scoped.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-nexus-muted text-sm p-8 text-center">
        <div className="max-w-sm">
          <Compass className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-nexus-text mb-1">Pipeline limpio.</p>
          <p className="text-xs leading-relaxed">Cuando crees tu primera misión, aparecerá aquí avanzando por el funnel. Sin prisa.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <header className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-nexus-text text-lg font-bold tracking-tight">Pipeline {userPlaybook?.nombre ? <span className="text-nexus-muted font-mono text-sm font-normal ml-2">// {userPlaybook.nombre}</span> : null}</h2>
          <p className="text-nexus-muted text-xs font-mono">{isSolo ? 'Tus misiones' : 'Pipeline del equipo'} — agrupadas por etapa</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <Stat label="Activas" value={totales.activas} />
          <Stat label="Cerca de cerrar" value={totales.cerca} accent="rgb(244,114,182)" />
          <Stat label="Ganadas" value={totales.ganadas} accent="rgb(34,197,94)" />
        </div>
      </header>

      {sprintActivo && (
        <div className="surface-elevated p-2 mb-4 border-blue-700/30 flex items-center gap-2 text-xs font-mono">
          <Target className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-nexus-muted">Sprint:</span>
          <span className="text-blue-300">{sprintActivo.nombre}</span>
          <span className="text-nexus-muted truncate">— {sprintActivo.goal}</span>
          <span className="ml-auto text-nexus-text font-bold">{metricas.sprintProgreso}%</span>
        </div>
      )}

      <div className="flex gap-3 items-stretch overflow-x-auto pb-3 stagger-in">
        {ETAPAS.map(e => (
          <Columna key={e.id} etapa={e} tareas={porEtapa[e.id]} ownerOf={ownerOf} />
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="text-right">
      <div className="text-nexus-muted text-[10px] uppercase tracking-widest">{label}</div>
      <div className="text-nexus-text font-bold text-base" style={accent ? { color: accent } : {}}>{value}</div>
    </div>
  )
}
