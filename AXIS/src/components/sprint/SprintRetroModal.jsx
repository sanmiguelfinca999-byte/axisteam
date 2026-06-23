import { useState, useEffect, useMemo } from 'react'
import { X, CheckCircle2, AlertOctagon, ArrowRightLeft, Activity, Sparkles, Save } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'

/**
 * SprintRetroModal — al cerrar un sprint, AXIS sintetiza:
 *  - Misiones completadas vs comprometidas
 *  - Reasignaciones ocurridas durante el sprint
 *  - Velocity (pts completados)
 *  - Blockers detectados (misiones que iniciaron y nunca completaron)
 * El Director puede editar las secciones antes de cerrarlo.
 */
export default function SprintRetroModal({ open, sprint, onClose }) {
  const { tasks, historialReasig, cerrarSprint, sprints } = useNEXUS()
  const [funciono, setFunciono] = useState('')
  const [fallo, setFallo] = useState('')
  const [notas, setNotas] = useState('')

  // Síntesis automática
  const synthesis = useMemo(() => {
    if (!sprint) return null
    const sprintTasks = tasks.filter(t => t.sprintId === sprint.id)
    const completed   = sprintTasks.filter(t => t.estado === 'COMPLETADA')
    const ptsCommit   = sprintTasks.reduce((s, t) => s + (t.storyPoints || 0), 0)
    const ptsDone     = completed.reduce((s, t) => s + (t.storyPoints || 0), 0)
    const ratio       = ptsCommit > 0 ? Math.round((ptsDone / ptsCommit) * 100) : 0
    const reasign     = (historialReasig || []).filter(r => {
      const t = new Date(r.timestamp).getTime()
      return t >= new Date(sprint.fechaInicio).getTime() && t <= new Date(sprint.fechaFin).getTime()
    })
    const enProgresoNoCerradas = sprintTasks.filter(t => t.estado !== 'COMPLETADA' && t.progreso > 0)
    return { sprintTasks, completed, ptsCommit, ptsDone, ratio, reasign, enProgresoNoCerradas, velocity: ptsDone }
  }, [sprint, tasks, historialReasig])

  // Pre-llenar sugerencias al abrir
  useEffect(() => {
    if (!open || !synthesis) return
    const fOk = []
    const fNo = []
    if (synthesis.ratio >= 80) fOk.push(`Cumplimiento de compromiso del ${synthesis.ratio}% (${synthesis.ptsDone}/${synthesis.ptsCommit} pts)`)
    if (synthesis.completed.length > 0) fOk.push(`${synthesis.completed.length} misión(es) completada(s)`)
    if (synthesis.reasign.length === 0) fOk.push('Sin reasignaciones durante el sprint — planificación estable')

    if (synthesis.ratio < 50) fNo.push(`Compromiso solo se cumplió al ${synthesis.ratio}% — sobreestimación o blockers`)
    if (synthesis.reasign.length > 2) fNo.push(`${synthesis.reasign.length} reasignaciones — posible inestabilidad en saturación`)
    if (synthesis.enProgresoNoCerradas.length > 0) fNo.push(`${synthesis.enProgresoNoCerradas.length} misión(es) iniciada(s) sin cerrar — revisar dependencies`)

    setFunciono(fOk.join('\n— ') ? '— ' + fOk.join('\n— ') : '')
    setFallo(fNo.join('\n— ')   ? '— ' + fNo.join('\n— ')   : '')
    setNotas('')
  }, [open, synthesis])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !sprint || !synthesis) return null

  const handleClose = async () => {
    await cerrarSprint(sprint.id, {
      funciono: funciono.split('\n').map(s => s.replace(/^—\s*/, '').trim()).filter(Boolean),
      fallo:    fallo.split('\n').map(s => s.replace(/^—\s*/, '').trim()).filter(Boolean),
      notas,
      velocity: synthesis.velocity,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="retro-title">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl surface-floating max-h-[85vh] flex flex-col animate-fade-in">
        <div className="px-5 py-4 border-b border-nexus-border/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 id="retro-title" className="text-nexus-text font-semibold tracking-wide">Retrospectiva — {sprint.nombre}</h2>
            <span className="ai-chip ml-1">AI</span>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-nexus-muted hover:text-nexus-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-nexus-muted text-xs font-mono">
            AXIS analizó {synthesis.sprintTasks.length} misión(es) del sprint. Edita la síntesis antes de cerrar.
          </p>

          {/* Stats summary */}
          <div className="grid grid-cols-4 gap-2">
            <div className="surface-card p-2.5 text-center">
              <CheckCircle2 className="w-4 h-4 text-nexus-green mx-auto mb-1" />
              <div className="text-nexus-text font-bold font-mono">{synthesis.completed.length}</div>
              <div className="text-nexus-muted text-[10px] font-mono uppercase">Completas</div>
            </div>
            <div className="surface-card p-2.5 text-center">
              <Activity className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-blue-300 font-bold font-mono">{synthesis.velocity}</div>
              <div className="text-nexus-muted text-[10px] font-mono uppercase">Velocity</div>
            </div>
            <div className="surface-card p-2.5 text-center">
              <ArrowRightLeft className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-purple-300 font-bold font-mono">{synthesis.reasign.length}</div>
              <div className="text-nexus-muted text-[10px] font-mono uppercase">Re-routes</div>
            </div>
            <div className="surface-card p-2.5 text-center">
              <AlertOctagon className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <div className="text-yellow-300 font-bold font-mono">{synthesis.ratio}%</div>
              <div className="text-nexus-muted text-[10px] font-mono uppercase">Cumplim.</div>
            </div>
          </div>

          <div>
            <label htmlFor="retro-ok" className="block text-nexus-green text-xs font-mono uppercase mb-1 tracking-widest">✓ Lo que funcionó</label>
            <textarea id="retro-ok" rows={4}
              value={funciono} onChange={e => setFunciono(e.target.value)}
              placeholder="— ..."
              className="w-full bg-nexus-bg border border-emerald-700/30 rounded-md px-3 py-2 text-nexus-text text-sm focus:outline-none focus:border-nexus-green transition-colors font-mono" />
          </div>

          <div>
            <label htmlFor="retro-no" className="block text-yellow-400 text-xs font-mono uppercase mb-1 tracking-widest">✗ Lo que no funcionó</label>
            <textarea id="retro-no" rows={4}
              value={fallo} onChange={e => setFallo(e.target.value)}
              placeholder="— ..."
              className="w-full bg-nexus-bg border border-yellow-700/30 rounded-md px-3 py-2 text-nexus-text text-sm focus:outline-none focus:border-yellow-500 transition-colors font-mono" />
          </div>

          <div>
            <label htmlFor="retro-notas" className="block text-nexus-muted text-xs font-mono uppercase mb-1 tracking-widest">Notas adicionales</label>
            <textarea id="retro-notas" rows={2}
              value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Acciones para el próximo sprint, contexto extra..."
              className="w-full bg-nexus-bg border border-nexus-border rounded-md px-3 py-2 text-nexus-text text-sm focus:outline-none focus:border-blue-500 transition-colors" />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-nexus-border/40 flex items-center justify-end gap-2 flex-shrink-0">
          <button type="button" onClick={onClose} className="hud-btn-ghost text-xs">Cancelar</button>
          <button type="button" onClick={handleClose}
            className="hud-btn-primary text-xs flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />Cerrar sprint y guardar retro
          </button>
        </div>
      </div>
    </div>
  )
}
