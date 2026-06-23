import { useState, useRef, useEffect } from 'react'
import { Target, ChevronDown, Calendar, CheckCircle2, Clock, Sparkles, Plus, Flag } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'
import QuickForm from './QuickForm'
import SprintRetroModal from '../sprint/SprintRetroModal'

const STATE_STYLES = {
  ACTIVE:    { label: 'Activo',     dot: 'bg-blue-400 status-pulse',  text: 'text-blue-300'  },
  UPCOMING:  { label: 'Próximo',    dot: 'bg-yellow-400',              text: 'text-yellow-300' },
  COMPLETED: { label: 'Cerrado',    dot: 'bg-nexus-green',             text: 'text-nexus-green' },
}

/**
 * SprintSelector — dropdown que reemplaza el chip estático del topbar.
 * Muestra el sprint activo y permite ver/cambiar a otros sprints (próximos o cerrados).
 */
export default function SprintSelector() {
  const { sprintActivo, sprints, crearSprint, isDirector } = useNEXUS()
  const [open, setOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [retroSprint, setRetroSprint] = useState(null)
  const ref = useRef(null)

  const handleCreate = (v) => {
    crearSprint(v.nombre, v.goal, Number(v.dias) || 14)
  }

  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!sprintActivo && sprints.length === 0) return null

  const sprint = sprintActivo || sprints[0]
  const diasRestantes = sprint
    ? Math.max(0, Math.ceil((new Date(sprint.fechaFin) - new Date()) / 86400000))
    : null

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={sprint.goal}
        className="hidden md:flex items-center gap-1.5 bg-blue-900/20 border border-blue-700/50 hover:border-blue-500 text-blue-300 text-xs font-mono px-2 py-0.5 rounded transition-colors focus-ring"
      >
        <Target className="w-3 h-3" />
        <span>{sprint.nombre}</span>
        {sprint.estado === 'ACTIVE' && diasRestantes !== null && (
          <span className="text-blue-400/70">· {diasRestantes}d</span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-80 surface-floating z-50 animate-fade-in" role="listbox" aria-label="Seleccionar sprint">
          <div className="p-3 border-b border-nexus-border/40">
            <div className="flex items-center gap-2 text-xs font-mono text-nexus-muted uppercase tracking-widest mb-1">
              <Target className="w-3 h-3" />Sprint Goal
            </div>
            <p className="text-nexus-text text-sm font-medium leading-snug">{sprint.goal}</p>
            <div className="flex items-center gap-3 mt-2 text-xs font-mono text-nexus-muted">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(sprint.fechaInicio).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} → {new Date(sprint.fechaFin).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}</span>
              {sprint.estado === 'ACTIVE' && <span className="text-blue-300">{diasRestantes}d restantes</span>}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto py-1">
            {sprints.map(s => {
              const style = STATE_STYLES[s.estado] || STATE_STYLES.UPCOMING
              const Icon = s.estado === 'COMPLETED' ? CheckCircle2 : s.estado === 'ACTIVE' ? Sparkles : Clock
              const isCurrent = s.id === sprint.id
              return (
                <div key={s.id}
                  className={`flex items-start gap-2 px-3 py-2 ${isCurrent ? 'bg-blue-900/20' : 'hover:bg-nexus-bg/40'} cursor-default`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${style.text}`} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-nexus-text text-sm font-medium">{s.nombre}</span>
                      <span className={`text-[10px] font-mono uppercase tracking-widest ${style.text}`}>{style.label}</span>
                    </div>
                    <p className="text-nexus-muted text-xs truncate">{s.goal}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="border-t border-nexus-border/40 p-2 space-y-1">
            {isDirector && sprintActivo && (
              <button onClick={() => { setOpen(false); setRetroSprint(sprintActivo) }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-mono text-purple-300 hover:bg-purple-900/20 transition-colors">
                <Flag className="w-3 h-3" />Cerrar sprint con retro
              </button>
            )}
            <button onClick={() => { setOpen(false); setNewOpen(true) }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-mono text-blue-300 hover:bg-blue-900/20 transition-colors">
              <Plus className="w-3 h-3" />Nuevo sprint
            </button>
          </div>
        </div>
      )}

      <QuickForm
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nuevo Sprint"
        submitLabel="Crear sprint"
        onSubmit={handleCreate}
        fields={[
          { name: 'nombre', label: 'Nombre del sprint', type: 'text', required: true, placeholder: 'Sprint 26', maxLength: 40 },
          { name: 'goal',   label: 'Sprint Goal',       type: 'textarea', required: true, placeholder: 'El objetivo único de este ciclo...' },
          { name: 'dias',   label: 'Duración (días)',   type: 'number', defaultValue: 14, min: 1, max: 90 },
        ]}
      />

      <SprintRetroModal
        open={!!retroSprint}
        sprint={retroSprint}
        onClose={() => setRetroSprint(null)}
      />
    </div>
  )
}
