import { useMemo } from 'react'
import { Users, Target, Sparkles, TrendingUp, AlertTriangle, Activity } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'

/**
 * CapacityView — Layer 3 (PLANNING) del Execution OS.
 * Materializa la promesa de capacity prospectiva, no reactiva.
 * Visualiza saturación por Operator en el Sprint activo + próximo.
 */
export default function CapacityView() {
  const { activosConSalud, tasks, sprintActivo, sprints, obtenerCandidatosParaTarea } = useNEXUS()

  const sprintProximo = useMemo(() => sprints.find(s => s.estado === 'UPCOMING'), [sprints])

  const rows = useMemo(() => {
    return activosConSalud.map(op => {
      const tareasActivas    = op.tareas.filter(t => t.estado !== 'COMPLETADA')
      const tareasSprint     = tareasActivas.filter(t => t.sprintId === sprintActivo?.id)
      const tareasProximo    = tareasActivas.filter(t => t.sprintId === sprintProximo?.id)
      const tareasSinSprint  = tareasActivas.filter(t => !t.sprintId)
      const ptsSprint        = tareasSprint.reduce((s, t) => s + (t.storyPoints || 0), 0)
      const ptsProximo       = tareasProximo.reduce((s, t) => s + (t.storyPoints || 0), 0)
      const criticas         = tareasActivas.filter(t => t.prioridad === 'CRITICA').length
      const vencidas         = tareasActivas.filter(t => new Date(t.fechaLimite) < new Date()).length
      return {
        ...op,
        tareasActivas: tareasActivas.length,
        tareasSprint: tareasSprint.length,
        ptsSprint,
        tareasProximo: tareasProximo.length,
        ptsProximo,
        tareasSinSprint: tareasSinSprint.length,
        criticasCount: criticas,
        vencidas,
      }
    })
  }, [activosConSalud, sprintActivo, sprintProximo])

  // Sugerencias RouteAI: para cada Operator en CHARLIE, recomienda candidatos
  const sugerencias = useMemo(() => {
    const out = []
    rows.filter(r => r.alertLevel === 'CHARLIE').forEach(r => {
      const tareaCritica = r.tareas.find(t => t.prioridad === 'CRITICA' && t.estado !== 'COMPLETADA')
      if (!tareaCritica) return
      const candidatos = obtenerCandidatosParaTarea(tareaCritica, r.id).slice(0, 1)
      if (candidatos.length > 0) {
        out.push({
          from: r.codename,
          to: candidatos[0].codename,
          score: candidatos[0].score,
          mision: tareaCritica.titulo,
        })
      }
    })
    return out
  }, [rows, obtenerCandidatosParaTarea])

  // Totales globales
  const totals = useMemo(() => {
    const totalPtsSprint = rows.reduce((s, r) => s + r.ptsSprint, 0)
    const totalActivas = rows.reduce((s, r) => s + r.tareasActivas, 0)
    const totalCriticas = rows.reduce((s, r) => s + r.criticasCount, 0)
    const totalCrisis = rows.filter(r => r.alertLevel === 'CHARLIE').length
    return { totalPtsSprint, totalActivas, totalCriticas, totalCrisis }
  }, [rows])

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-nexus-muted text-xs font-mono uppercase tracking-widest">
            <Users className="w-3 h-3" />Planning Layer
          </div>
          <h1 className="text-nexus-text text-2xl font-bold mt-1">Capacity</h1>
          <p className="text-nexus-muted text-sm">Predictivo, no reactivo. Lo que cada Operator puede tomar antes de que se rompa.</p>
        </div>
        <div className="flex items-center gap-3">
          {sprintActivo && (
            <div className="text-right">
              <div className="text-xs font-mono text-nexus-muted">Sprint activo</div>
              <div className="text-sm text-blue-300 font-mono">{sprintActivo.nombre}</div>
            </div>
          )}
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="surface-card p-3">
          <div className="text-nexus-muted text-xs font-mono">Points en sprint</div>
          <div className="text-nexus-text text-2xl font-bold font-mono mt-1">{totals.totalPtsSprint}</div>
        </div>
        <div className="surface-card p-3">
          <div className="text-nexus-muted text-xs font-mono">Misiones activas</div>
          <div className="text-nexus-text text-2xl font-bold font-mono mt-1">{totals.totalActivas}</div>
        </div>
        <div className="surface-card p-3">
          <div className="text-nexus-muted text-xs font-mono">Críticas pendientes</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${totals.totalCriticas > 0 ? 'text-red-400' : 'text-nexus-text'}`}>{totals.totalCriticas}</div>
        </div>
        <div className="surface-card p-3">
          <div className="text-nexus-muted text-xs font-mono">Operators en crisis</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${totals.totalCrisis > 0 ? 'text-red-400' : 'text-nexus-green'}`}>{totals.totalCrisis}</div>
        </div>
      </div>

      {/* Sugerencias RouteAI */}
      {sugerencias.length > 0 && (
        <div className="surface-elevated p-4 border-purple-700/40" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(139,92,246,0))' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-purple-300 text-xs font-mono uppercase tracking-widest font-bold">RouteAI · Recomendaciones</span>
            <span className="ai-chip ml-auto">AI</span>
          </div>
          <div className="space-y-2">
            {sugerencias.map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <span className="text-red-300 font-mono">{s.from}</span>
                  <span className="text-nexus-muted mx-2">→</span>
                  <span className="text-nexus-green font-mono">{s.to}</span>
                  <span className="text-nexus-muted ml-3 text-xs">para: <span className="text-nexus-text">{s.mision}</span></span>
                </div>
                <span className="text-xs font-mono text-purple-300/80">score {s.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla principal */}
      <div className="surface-elevated overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs font-mono uppercase tracking-widest text-nexus-muted border-b border-nexus-border">
            <tr>
              <th className="text-left py-3 px-3">Operator</th>
              <th className="text-center py-3 px-2">Salud</th>
              <th className="text-center py-3 px-2">Activas</th>
              <th className="text-center py-3 px-2">Críticas</th>
              <th className="text-center py-3 px-2">Vencidas</th>
              <th className="text-center py-3 px-2" title="Story points en sprint activo">Pts Sprint</th>
              <th className="text-center py-3 px-2" title="Story points en sprint próximo">Pts Próximo</th>
              <th className="text-center py-3 px-2">Carga</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => <CapacityRow key={r.id} row={r} />)}
          </tbody>
        </table>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs font-mono text-nexus-muted">
        <div className="flex items-center gap-1"><span className="status-dot bg-nexus-green" />Carga sana (&lt;70%)</div>
        <div className="flex items-center gap-1"><span className="status-dot bg-yellow-500" />Sobrecarga (70-90%)</div>
        <div className="flex items-center gap-1"><span className="status-dot bg-red-500" />Crisis (&gt;90%)</div>
      </div>
    </div>
  )
}

function CapacityRow({ row }) {
  const { setSelectedActivoId, setActiveView } = useNEXUS()
  const loadPct = Math.min(100, Math.round((row.tareasActivas / 4) * 100))
  const loadColor = loadPct >= 90 ? 'bg-red-500' : loadPct >= 70 ? 'bg-yellow-500' : 'bg-nexus-green'

  const handleOpen = () => {
    setSelectedActivoId(row.id)
    setActiveView('hud')
  }

  return (
    <tr className="border-b border-nexus-border/40 hover:bg-nexus-bg/30 transition-colors cursor-pointer" onClick={handleOpen}>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">{row.avatar}</span>
          <div>
            <div className="text-nexus-text font-medium">{row.codename}</div>
            <div className="text-nexus-muted text-xs">{row.nombre}</div>
          </div>
        </div>
      </td>
      <td className="text-center px-2">
        <div className="flex items-center justify-center gap-1.5">
          <span className={`status-dot ${
            row.alertLevel === 'CHARLIE' ? 'bg-red-500 animate-blink' :
            row.alertLevel === 'BRAVO' ? 'bg-yellow-500' : 'bg-nexus-green'
          }`} />
          <span className={`font-mono font-bold ${
            row.alertLevel === 'CHARLIE' ? 'text-red-400' :
            row.alertLevel === 'BRAVO' ? 'text-yellow-300' : 'text-nexus-green'
          }`}>{row.salud}%</span>
        </div>
      </td>
      <td className="text-center px-2 text-nexus-text font-mono">{row.tareasActivas}</td>
      <td className="text-center px-2">
        {row.criticasCount > 0
          ? <span className="text-red-400 font-mono font-bold">{row.criticasCount}</span>
          : <span className="text-nexus-muted font-mono">—</span>}
      </td>
      <td className="text-center px-2">
        {row.vencidas > 0
          ? <span className="text-yellow-300 font-mono font-bold flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" />{row.vencidas}</span>
          : <span className="text-nexus-muted font-mono">—</span>}
      </td>
      <td className="text-center px-2">
        <div className="flex items-center justify-center gap-1.5">
          <Target className="w-3 h-3 text-blue-400" />
          <span className="text-blue-300 font-mono font-bold">{row.ptsSprint}</span>
          <span className="text-nexus-muted text-xs">({row.tareasSprint})</span>
        </div>
      </td>
      <td className="text-center px-2 text-nexus-muted font-mono">
        {row.ptsProximo > 0 ? `${row.ptsProximo} (${row.tareasProximo})` : '—'}
      </td>
      <td className="px-2 min-w-[120px]">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-nexus-bg rounded-full h-2 overflow-hidden">
            <div className={`h-2 ${loadColor} transition-all`} style={{ width: `${loadPct}%` }} />
          </div>
          <span className="text-xs font-mono text-nexus-muted w-9 text-right">{loadPct}%</span>
        </div>
      </td>
    </tr>
  )
}
