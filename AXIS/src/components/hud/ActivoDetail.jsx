import { useState } from 'react'
import { X, CheckCircle, Clock, AlertTriangle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'
import MissionTimeline from '../mision/MissionTimeline'

const PRIORIDAD_STYLES = {
  CRITICA: { bg: 'bg-red-900/30',    border: 'border-red-700',    text: 'text-red-300',    label: 'CRITICA'    },
  ALTA:    { bg: 'bg-yellow-900/20', border: 'border-yellow-700', text: 'text-yellow-300', label: 'ALTA'       },
  NORMAL:  { bg: 'bg-blue-900/20',   border: 'border-blue-700',   text: 'text-blue-300',   label: 'NORMAL'     },
  BAJA:    { bg: 'bg-nexus-bg',      border: 'border-nexus-border', text: 'text-nexus-muted', label: 'BAJA'    },
}

function TaskRow({ tarea, onComplete, onProgress }) {
  const ps = PRIORIDAD_STYLES[tarea.prioridad] || PRIORIDAD_STYLES.NORMAL
  const vencida = new Date(tarea.fechaLimite) < new Date() && tarea.estado !== 'COMPLETADA'
  const [showTimeline, setShowTimeline] = useState(false)
  const eventCount = (tarea.eventos || []).length

  return (
    <div className={`rounded-md border p-3 ${ps.bg} ${ps.border} ${tarea.reasignada ? 'opacity-80' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${ps.bg} ${ps.border} ${ps.text}`}>{ps.label}</span>
            {tarea.reasignada && <span className="text-xs text-nexus-muted font-mono">[REASIGNADA]</span>}
            {vencida && <span className="text-xs text-red-400 font-mono flex items-center gap-1"><AlertTriangle className="w-3 h-3" />VENCIDA</span>}
          </div>
          <p className="text-nexus-text text-sm font-medium leading-tight truncate">{tarea.titulo}</p>
          <p className="text-nexus-muted text-xs mt-0.5 line-clamp-2">{tarea.descripcion}</p>
        </div>
        {tarea.estado !== 'COMPLETADA' && (
          <button onClick={() => onComplete(tarea.id)} title="Marcar completada" aria-label={`Marcar ${tarea.titulo} como completada`}
            className="flex-shrink-0 text-nexus-muted hover:text-nexus-green transition-colors">
            <CheckCircle className="w-5 h-5" />
          </button>
        )}
        {tarea.estado === 'COMPLETADA' && (<CheckCircle className="flex-shrink-0 w-5 h-5 text-nexus-green" />)}
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between text-xs text-nexus-muted mb-1">
          <span className="font-mono">Progreso</span>
          <span className="font-bold">{tarea.progreso}%</span>
        </div>
        <div className="w-full bg-nexus-bg rounded-full h-1.5 relative">
          <div className="h-1.5 rounded-full transition-all duration-300" style={{
            width: `${tarea.progreso}%`,
            background: tarea.estado === 'COMPLETADA' ? '#10b981' : tarea.prioridad === 'CRITICA' ? '#ef4444' : '#3b82f6',
          }} />
          {tarea.estado !== 'COMPLETADA' && (
            <input type="range" min="0" max="100" step="5" value={tarea.progreso}
              onChange={e => onProgress(tarea.id, parseInt(e.target.value, 10))}
              aria-label={`Progreso de ${tarea.titulo}`}
              className="absolute inset-0 opacity-0 cursor-pointer w-full" title={`Ajustar progreso: ${tarea.progreso}%`} />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-1 text-xs text-nexus-muted font-mono">
          <Clock className="w-3 h-3" />
          {new Date(tarea.fechaLimite).toLocaleDateString('es-MX')}
        </div>
        <button onClick={() => setShowTimeline(s => !s)} aria-expanded={showTimeline}
          aria-label={`${showTimeline ? 'Ocultar' : 'Mostrar'} historial`}
          className="flex items-center gap-1 text-xs text-nexus-muted hover:text-blue-300 font-mono transition-colors">
          <MessageSquare className="w-3 h-3" />
          {eventCount > 0 ? `${eventCount}` : ''}
          {showTimeline ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showTimeline && <MissionTimeline tarea={tarea} canComment={true} />}
    </div>
  )
}

export default function ActivoDetail() {
  const { selectedActivoId, setSelectedActivoId, completarTarea, actualizarProgreso, setModalCrisis, activosConSalud } = useNEXUS()
  if (!selectedActivoId) return null

  const activo = activosConSalud.find(a => a.id === selectedActivoId)
  if (!activo) return null

  const tareasActivo = activo.tareas
  const activas  = tareasActivo.filter(t => t.estado !== 'COMPLETADA')
  const completas = tareasActivo.filter(t => t.estado === 'COMPLETADA')

  return (
    <div className="h-full flex flex-col animate-slide-in">
      <div className="flex items-center justify-between p-4 border-b border-nexus-border">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden="true">{activo.avatar}</span>
          <div>
            <h2 className="text-nexus-text font-bold">{activo.nombre}</h2>
            <p className="text-nexus-muted text-xs font-mono">{activo.codename} · {activo.especialidad}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activo.alertLevel === 'CHARLIE' && (
            <button onClick={() => setModalCrisis(activo)}
              aria-label={`Re-route de misiones de ${activo.codename}`}
              className="hud-btn-danger text-xs flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />Re-route
            </button>
          )}
          <button onClick={() => setSelectedActivoId(null)} aria-label="Cerrar panel" className="text-nexus-muted hover:text-nexus-text">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-md bg-nexus-bg border border-nexus-border">
          <div className="text-center">
            <div className={`text-2xl font-bold font-mono ${
              activo.color === 'red' ? 'text-red-400' : activo.color === 'yellow' ? 'text-yellow-400' : 'text-nexus-green'
            }`}>{activo.salud}%</div>
            <div className="text-nexus-muted text-xs">SALUD</div>
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 text-center text-xs">
            <div><div className="font-bold text-nexus-text">{activo.activas ?? 0}</div><div className="text-nexus-muted">Activas</div></div>
            <div><div className="font-bold text-red-400">{activo.criticas ?? 0}</div><div className="text-nexus-muted">Criticas</div></div>
            <div><div className="font-bold text-nexus-green">{completas.length}</div><div className="text-nexus-muted">Completas</div></div>
          </div>
        </div>

        {activas.length > 0 && (
          <div>
            <h3 className="text-nexus-muted text-xs font-mono uppercase tracking-widest mb-2">Misiones activas ({activas.length})</h3>
            <div className="space-y-2">
              {activas.map(t => <TaskRow key={t.id} tarea={t} onComplete={completarTarea} onProgress={actualizarProgreso} />)}
            </div>
          </div>
        )}

        {completas.length > 0 && (
          <div>
            <h3 className="text-nexus-muted text-xs font-mono uppercase tracking-widest mb-2">Completadas ({completas.length})</h3>
            <div className="space-y-2 opacity-70">
              {completas.map(t => <TaskRow key={t.id} tarea={t} onComplete={completarTarea} onProgress={actualizarProgreso} />)}
            </div>
          </div>
        )}

        {activas.length === 0 && completas.length === 0 && (
          <div className="text-center py-8 text-nexus-muted">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-mono">Sin misiones asignadas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
