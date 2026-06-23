import { useMemo } from 'react'
import { TrendingUp, Users, AlertTriangle, CheckCircle, FileText, Zap, Target, Activity } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'

function KPICard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    green:  { text: 'text-nexus-green',  border: 'border-nexus-green/30',  bg: 'bg-nexus-green/10'  },
    red:    { text: 'text-red-400',       border: 'border-red-500/30',      bg: 'bg-red-900/20'      },
    yellow: { text: 'text-yellow-400',    border: 'border-yellow-500/30',   bg: 'bg-yellow-900/20'   },
    blue:   { text: 'text-blue-400',      border: 'border-blue-500/30',     bg: 'bg-blue-900/20'     },
    purple: { text: 'text-purple-400',    border: 'border-purple-500/30',   bg: 'bg-purple-900/20'   },
    muted:  { text: 'text-nexus-muted',   border: 'border-nexus-border',    bg: 'bg-nexus-bg'        },
  }
  const s = colors[color] || colors.muted
  return (
    <div className={`hud-card p-4 border ${s.border} ${s.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${s.text}`} />
        <span className="text-nexus-muted text-xs font-mono">{label}</span>
      </div>
      <div className={`text-3xl font-bold font-mono ${s.text}`}>{value}</div>
      {sub && <div className="text-nexus-muted text-xs mt-1">{sub}</div>}
    </div>
  )
}

// ============================================================
// Velocity chart — bar chart SVG inline por sprint
// ============================================================
function VelocityChart({ sprints, tasks }) {
  const data = useMemo(() => {
    const ordered = [...sprints].sort((a, b) => new Date(a.fechaFin) - new Date(b.fechaFin))
    return ordered.map(s => {
      const sprintTasks = tasks.filter(t => t.sprintId === s.id)
      const completed   = sprintTasks.filter(t => t.estado === 'COMPLETADA')
      const ptsCommit   = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
      const ptsDone     = completed.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
      return { id: s.id, name: s.nombre, estado: s.estado, ptsCommit, ptsDone }
    })
  }, [sprints, tasks])

  if (data.length === 0) return <EmptyChart label="Sin sprints registrados aún" />

  const maxPts = Math.max(...data.map(d => d.ptsCommit), 1)
  const W = 600, H = 180, P = 28, barW = (W - 2 * P) / data.length * 0.6, gap = (W - 2 * P) / data.length

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Velocity por sprint">
      {/* Y axis labels */}
      {[0, 0.5, 1].map(f => {
        const y = H - P - f * (H - 2 * P)
        return (
          <g key={f}>
            <line x1={P} x2={W - P} y1={y} y2={y} stroke="#1e2a5e" strokeDasharray="2,2" />
            <text x={P - 6} y={y + 3} fill="#6b7db3" fontSize="10" fontFamily="monospace" textAnchor="end">
              {Math.round(maxPts * f)}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const x = P + i * gap + (gap - barW) / 2
        const hCommit = ((d.ptsCommit / maxPts) * (H - 2 * P)) || 0
        const hDone   = ((d.ptsDone   / maxPts) * (H - 2 * P)) || 0
        return (
          <g key={d.id}>
            {/* commitment fantasma */}
            <rect x={x} y={H - P - hCommit} width={barW} height={hCommit}
              fill="#1e2a5e" rx="2" opacity="0.5" />
            {/* completados (encima) */}
            <rect x={x} y={H - P - hDone} width={barW} height={hDone}
              fill={d.estado === 'ACTIVE' ? '#3b82f6' : d.estado === 'COMPLETED' ? '#22D3A8' : '#7A8AB8'}
              rx="2" />
            <text x={x + barW / 2} y={H - P + 14} fill="#7A8AB8" fontSize="10" fontFamily="monospace" textAnchor="middle">
              {d.name.replace('Sprint ', 'S')}
            </text>
            <text x={x + barW / 2} y={H - P - hDone - 4} fill="#E8ECFF" fontSize="10" fontFamily="monospace" textAnchor="middle">
              {d.ptsDone}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ============================================================
// Burndown chart — sprint activo, línea ideal vs línea real
// ============================================================
function BurndownChart({ sprint, tasks }) {
  const data = useMemo(() => {
    if (!sprint) return null
    const start = new Date(sprint.fechaInicio)
    const end   = new Date(sprint.fechaFin)
    const totalDays = Math.max(1, Math.ceil((end - start) / 86400000))
    const sprintTasks = tasks.filter(t => t.sprintId === sprint.id)
    const totalPts = sprintTasks.reduce((s, t) => s + (t.storyPoints || 0), 0)
    if (totalPts === 0) return null

    // Para cada día, contar puntos pendientes (basado en eventos COMPLETED de las misiones)
    const days = []
    for (let d = 0; d <= totalDays; d++) {
      const cutoff = new Date(start.getTime() + d * 86400000)
      const completedByDay = sprintTasks.filter(t => {
        const completedEv = (t.eventos || []).find(e => e.tipo === 'COMPLETED')
        if (!completedEv) return false
        return new Date(completedEv.timestamp) <= cutoff
      })
      const completedPts = completedByDay.reduce((s, t) => s + (t.storyPoints || 0), 0)
      days.push({ day: d, remaining: totalPts - completedPts, ideal: totalPts * (1 - d / totalDays) })
    }
    return { days, totalPts, totalDays }
  }, [sprint, tasks])

  if (!data) return <EmptyChart label="Burndown disponible cuando haya misiones con story points en el sprint" />

  const W = 600, H = 180, P = 28
  const xScale = (i) => P + (i / data.totalDays) * (W - 2 * P)
  const yScale = (v) => H - P - (v / data.totalPts) * (H - 2 * P)

  const idealPath = `M ${xScale(0)} ${yScale(data.totalPts)} L ${xScale(data.totalDays)} ${yScale(0)}`
  const realPath  = data.days.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.day)} ${yScale(d.remaining)}`).join(' ')

  // Día actual (cuántos días han pasado)
  const todayIdx = Math.min(
    data.totalDays,
    Math.max(0, Math.ceil((Date.now() - new Date(sprint.fechaInicio)) / 86400000))
  )
  const todayPts = data.days[todayIdx]?.remaining ?? data.totalPts

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Burndown del sprint activo">
      {/* Grid */}
      {[0, 0.5, 1].map(f => {
        const y = H - P - f * (H - 2 * P)
        return (
          <g key={f}>
            <line x1={P} x2={W - P} y1={y} y2={y} stroke="#1e2a5e" strokeDasharray="2,2" />
            <text x={P - 6} y={y + 3} fill="#6b7db3" fontSize="10" fontFamily="monospace" textAnchor="end">
              {Math.round(data.totalPts * f)}
            </text>
          </g>
        )
      })}
      {/* Línea ideal */}
      <path d={idealPath} fill="none" stroke="#7A8AB8" strokeWidth="1.5" strokeDasharray="4,4" />
      {/* Línea real */}
      <path d={realPath} fill="none" stroke="#3b82f6" strokeWidth="2" />
      {/* Puntos sobre línea real */}
      {data.days.filter((_, i) => i <= todayIdx).map((d, i) => (
        <circle key={i} cx={xScale(d.day)} cy={yScale(d.remaining)} r="2.5" fill="#3b82f6" />
      ))}
      {/* Marker día actual */}
      <line x1={xScale(todayIdx)} x2={xScale(todayIdx)} y1={P} y2={H - P} stroke="#FFB547" strokeDasharray="3,3" opacity="0.7" />
      <text x={xScale(todayIdx) + 4} y={P + 10} fill="#FFB547" fontSize="10" fontFamily="monospace">hoy: {todayPts} pts</text>
      {/* Labels */}
      <text x={P} y={H - 6} fill="#7A8AB8" fontSize="10" fontFamily="monospace">día 0</text>
      <text x={W - P} y={H - 6} fill="#7A8AB8" fontSize="10" fontFamily="monospace" textAnchor="end">día {data.totalDays}</text>
    </svg>
  )
}

function EmptyChart({ label }) {
  return (
    <div className="h-44 flex items-center justify-center text-nexus-muted text-xs font-mono">
      {label}
    </div>
  )
}

// ============================================================
// Componente principal
// ============================================================
export default function DashboardMetrics() {
  const { metricas, detectarCrisis, historialReasig, sprints, sprintActivo, tasks } = useNEXUS()
  const activos = detectarCrisis()

  const pcCompletion = metricas.totalTareas > 0
    ? Math.round((metricas.completadas / metricas.totalTareas) * 100)
    : 0

  const avgSalud = activos.length > 0
    ? Math.round(activos.reduce((s, a) => s + a.salud, 0) / activos.length)
    : 0

  // Throughput últimos 7 días
  const throughput7d = useMemo(() => {
    const cutoff = Date.now() - 7 * 86400000
    return tasks.filter(t => {
      const ev = (t.eventos || []).find(e => e.tipo === 'COMPLETED')
      return ev && new Date(ev.timestamp).getTime() >= cutoff
    }).length
  }, [tasks])

  // Lead time promedio (días)
  const leadTime = useMemo(() => {
    const completedTasks = tasks.filter(t => t.estado === 'COMPLETADA')
    if (completedTasks.length === 0) return null
    let total = 0, count = 0
    for (const t of completedTasks) {
      const created = new Date(t.fechaCreacion).getTime()
      const completedEv = (t.eventos || []).find(e => e.tipo === 'COMPLETED')
      if (!completedEv) continue
      const completed = new Date(completedEv.timestamp).getTime()
      total += (completed - created) / 86400000
      count++
    }
    return count > 0 ? Math.round(total / count * 10) / 10 : null
  }, [tasks])

  // Velocity media (puntos completados por sprint cerrado)
  const velocityMedia = useMemo(() => {
    const closed = sprints.filter(s => s.estado === 'COMPLETED')
    if (closed.length === 0) return null
    const total = closed.reduce((sum, s) => {
      const pts = tasks
        .filter(t => t.sprintId === s.id && t.estado === 'COMPLETADA')
        .reduce((a, t) => a + (t.storyPoints || 0), 0)
      return sum + pts
    }, 0)
    return Math.round(total / closed.length)
  }, [sprints, tasks])

  return (
    <div className="p-4 space-y-4 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-blue-400" />
        <h2 className="text-nexus-text font-bold text-sm tracking-widest uppercase">Insights · Panel de Métricas Ejecutivo</h2>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={CheckCircle} label="Completadas" value={`${pcCompletion}%`}
          sub={`${metricas.completadas} de ${metricas.totalTareas}`} color="green" />
        <KPICard icon={Activity} label="Throughput 7d" value={throughput7d}
          sub="misiones cerradas" color="blue" />
        <KPICard icon={Target} label="Velocity media" value={velocityMedia ?? '—'}
          sub="pts/sprint cerrado" color="purple" />
        <KPICard icon={Users} label="Salud promedio" value={`${avgSalud}%`}
          sub="Todos los Operators" color={avgSalud >= 70 ? 'green' : avgSalud >= 40 ? 'yellow' : 'red'} />
        <KPICard icon={AlertTriangle} label="En Crisis" value={metricas.enCrisis}
          sub="Nivel CHARLIE" color={metricas.enCrisis > 0 ? 'red' : 'green'} />
        <KPICard icon={Zap} label="Sobrecarga" value={metricas.enSobrecarga}
          sub="Nivel BRAVO" color={metricas.enSobrecarga > 0 ? 'yellow' : 'green'} />
        <KPICard icon={AlertTriangle} label="Críticas" value={metricas.criticas}
          sub="Sin completar" color={metricas.criticas > 3 ? 'red' : 'yellow'} />
        <KPICard icon={FileText} label="Lead time" value={leadTime !== null ? `${leadTime}d` : '—'}
          sub="creación → cierre" color="muted" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="surface-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest flex items-center gap-1">
              <Target className="w-3 h-3" />Velocity por sprint
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-nexus-muted"><span className="status-dot bg-nexus-border" />Compromiso</span>
              <span className="flex items-center gap-1 text-blue-300"><span className="status-dot bg-blue-500" />Completado</span>
            </div>
          </div>
          <VelocityChart sprints={sprints} tasks={tasks} />
        </div>

        <div className="surface-elevated p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest flex items-center gap-1">
              <Activity className="w-3 h-3" />Burndown sprint activo {sprintActivo ? `· ${sprintActivo.nombre}` : ''}
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-nexus-muted"><span className="w-3 h-px bg-nexus-muted" style={{borderTop: '1px dashed'}} />Ideal</span>
              <span className="flex items-center gap-1 text-blue-300"><span className="w-3 h-px bg-blue-400" />Real</span>
            </div>
          </div>
          {sprintActivo
            ? <BurndownChart sprint={sprintActivo} tasks={tasks} />
            : <EmptyChart label="Sin sprint activo" />}
        </div>
      </div>

      {/* Status table */}
      <div className="surface-elevated overflow-hidden">
        <div className="px-4 py-2 border-b border-nexus-border">
          <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest">Estado de Operators</span>
        </div>
        <div className="divide-y divide-nexus-border/50">
          {activos.map(a => (
            <div key={a.id} className="flex items-center justify-between px-4 py-2 hover:bg-nexus-surface/50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-base">{a.avatar}</span>
                <div>
                  <span className="text-nexus-text text-sm">{a.codename}</span>
                  <span className="text-nexus-muted text-xs ml-2">· {a.nombre}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="text-nexus-muted">{a.activas ?? 0} act.</span>
                <span className={a.alertLevel === 'CHARLIE' ? 'text-red-400 font-bold' : a.alertLevel === 'BRAVO' ? 'text-yellow-400' : 'text-nexus-green'}>{a.nivel}</span>
                <span className={a.color === 'red' ? 'text-red-400' : a.color === 'yellow' ? 'text-yellow-400' : 'text-nexus-green'}>{a.salud}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial reasignaciones */}
      {historialReasig.length > 0 && (
        <div className="surface-elevated overflow-hidden">
          <div className="px-4 py-2 border-b border-nexus-border">
            <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest">Últimas reasignaciones</span>
          </div>
          <div className="divide-y divide-nexus-border/50">
            {historialReasig.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-2 text-xs">
                <div>
                  <span className="text-nexus-text font-medium truncate block max-w-[280px]">{r.tareaTitulo}</span>
                  <span className="text-nexus-muted font-mono">{r.activoOrigen} → {r.activoDestino}</span>
                </div>
                <div className="text-right">
                  <div className="text-purple-400 font-mono">{r.sirId}</div>
                  <div className="text-nexus-muted">{new Date(r.timestamp).toLocaleDateString('es-MX')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
