import { useMemo, useState, lazy, Suspense } from 'react'
import { CheckCircle, Clock, AlertTriangle, Minus, Plus, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'
import SIRBanner from '../sir/SIRBanner'
import MissionTimeline from '../mision/MissionTimeline'
import MorningBrief from '../brief/MorningBrief'
import WelcomeBackBanner from '../welcome/WelcomeBackBanner'

// Vistas adaptadas por dominio (Ola 3). Reusan los mismos chunks que App.jsx.
const PipelineHUD   = lazy(() => import('../hud/playbook-views/PipelineHUD'))
const StreakHUD     = lazy(() => import('../hud/playbook-views/StreakHUD'))
const MultiTrackHUD = lazy(() => import('../hud/playbook-views/MultiTrackHUD'))

const SOLO_HUD_BY_VISTA = {
  pipeline: PipelineHUD,
  streak: StreakHUD,
  'multi-track': MultiTrackHUD,
}

function SoloHUDFallback() {
  return (
    <div className="h-full flex items-center justify-center text-nexus-muted font-mono text-sm">
      <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin mr-2" />
      Cargando vista adaptada...
    </div>
  )
}

const PRIORIDAD_STYLES = {
  CRITICA: { border: 'border-red-600',    text: 'text-red-300',    label: 'CRITICA',    bg: 'bg-red-900/20'    },
  ALTA:    { border: 'border-yellow-600', text: 'text-yellow-300', label: 'ALTA',       bg: 'bg-yellow-900/10' },
  NORMAL:  { border: 'border-blue-700',   text: 'text-blue-300',   label: 'NORMAL',     bg: 'bg-blue-900/10'   },
  BAJA:    { border: 'border-nexus-border', text: 'text-nexus-muted', label: 'BAJA',    bg: ''                 },
}

function MisionCard({ tarea, onComplete, onProgress }) {
  const ps = PRIORIDAD_STYLES[tarea.prioridad] || PRIORIDAD_STYLES.NORMAL
  const vencida = new Date(tarea.fechaLimite) < new Date() && tarea.estado !== 'COMPLETADA'
  const completada = tarea.estado === 'COMPLETADA'
  const [showTimeline, setShowTimeline] = useState(false)
  const eventCount = (tarea.eventos || []).length

  return (
    <div className={`hud-card border ${ps.border} ${ps.bg} p-4 transition-all ${completada ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded border ${ps.text} ${ps.border}`}>{ps.label}</span>
            {tarea.reasignada && (<span className="text-xs text-purple-400 font-mono border border-purple-700 px-1.5 py-0.5 rounded">REASIGNADA</span>)}
            {vencida && !completada && (<span className="text-xs text-red-400 flex items-center gap-1 font-mono"><AlertTriangle className="w-3 h-3" />VENCIDA</span>)}
            {completada && (<span className="text-xs text-nexus-green flex items-center gap-1 font-mono"><CheckCircle className="w-3 h-3" />COMPLETADA</span>)}
          </div>
          <h3 className="text-nexus-text font-semibold">{tarea.titulo}</h3>
          <p className="text-nexus-muted text-sm mt-1">{tarea.descripcion}</p>
        </div>
        {!completada && (
          <button onClick={() => onComplete(tarea.id)} aria-label={`Marcar ${tarea.titulo} como completada`}
            className="flex-shrink-0 text-nexus-muted hover:text-nexus-green transition-colors p-1">
            <CheckCircle className="w-6 h-6" />
          </button>
        )}
      </div>

      {!completada && (
        <div className="mb-3">
          <div className="flex justify-between items-center text-xs text-nexus-muted font-mono mb-2">
            <label htmlFor={`progreso-${tarea.id}`}>Progreso</label>
            <span className="font-bold text-nexus-text" aria-live="polite">{tarea.progreso}%</span>
          </div>
          <div className="relative w-full bg-nexus-bg rounded-full h-2 mb-2" aria-hidden="true">
            <div className="h-2 rounded-full transition-all duration-300" style={{ width: `${tarea.progreso}%`, background: tarea.prioridad === 'CRITICA' ? '#ef4444' : tarea.prioridad === 'ALTA' ? '#f59e0b' : '#3b82f6' }} />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onProgress(tarea.id, tarea.progreso - 10)} disabled={tarea.progreso <= 0} aria-label={`Disminuir progreso de ${tarea.titulo}`}
              className="p-1.5 rounded border border-nexus-border text-nexus-muted hover:text-nexus-text hover:border-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Minus className="w-3 h-3" />
            </button>
            <input id={`progreso-${tarea.id}`} type="range" min="0" max="100" step="5" value={tarea.progreso}
              onChange={e => onProgress(tarea.id, parseInt(e.target.value, 10))}
              aria-label={`Progreso de la mision ${tarea.titulo}`}
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={tarea.progreso}
              className="flex-1 h-1 accent-blue-500 cursor-pointer" />
            <button type="button" onClick={() => onProgress(tarea.id, tarea.progreso + 10)} disabled={tarea.progreso >= 100} aria-label={`Aumentar progreso de ${tarea.titulo}`}
              className="p-1.5 rounded border border-nexus-border text-nexus-muted hover:text-nexus-text hover:border-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-nexus-muted font-mono">
          <Clock className="w-3 h-3" />
          <span>Limite: {new Date(tarea.fechaLimite).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
        <button
          onClick={() => setShowTimeline(s => !s)}
          aria-expanded={showTimeline}
          aria-label={`${showTimeline ? 'Ocultar' : 'Mostrar'} historial de ${tarea.titulo}`}
          className="flex items-center gap-1 text-xs text-nexus-muted hover:text-blue-300 font-mono transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          Historial{eventCount > 0 && <span className="text-blue-300 font-bold">({eventCount})</span>}
          {showTimeline ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {showTimeline && <MissionTimeline tarea={tarea} canComment={true} />}
    </div>
  )
}

export default function FocusMode() {
  const { currentUser, tasks, completarTarea, actualizarProgreso, axisMode, userPlaybook } = useNEXUS()
  const isSolo = axisMode === 'solo'

  const misTareas = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'CORONEL' && !isSolo) return []
    return tasks.filter(t => t.activoId === currentUser.id)
  }, [tasks, currentUser, isSolo])

  const vista = isSolo ? (userPlaybook?.vistaHUD || 'standard') : 'standard'
  const SoloHUD = SOLO_HUD_BY_VISTA[vista]
  if (isSolo && SoloHUD) {
    return (
      <Suspense fallback={<SoloHUDFallback />}>
        <SoloHUD />
      </Suspense>
    )
  }

  const activas   = misTareas.filter(t => t.estado !== 'COMPLETADA')
  const completas = misTareas.filter(t => t.estado === 'COMPLETADA')
  const criticas  = activas.filter(t => t.prioridad === 'CRITICA')
  const otras     = activas.filter(t => t.prioridad !== 'CRITICA')
  const progGlobal = misTareas.length > 0 ? Math.round(misTareas.reduce((s, t) => s + t.progreso, 0) / misTareas.length) : 0

  if (!currentUser) return null

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <WelcomeBackBanner />
      <MorningBrief />
      <SIRBanner />
      <div className="hud-card p-4 flex items-center gap-4" style={{ borderColor: '#1e2a5e', boxShadow: '0 0 20px rgba(59,130,246,0.08)' }}>
        <div className="text-4xl" aria-hidden="true">{currentUser.avatar}</div>
        <div className="flex-1">
          <h2 className="text-nexus-text font-bold text-lg">{currentUser.nombre}<span className="text-nexus-muted font-mono text-sm ml-2">. {currentUser.codename}</span></h2>
          <p className="text-nexus-muted text-sm">{currentUser.especialidad}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold font-mono text-blue-400">{progGlobal}%</div>
          <div className="text-nexus-muted text-xs font-mono">progreso global</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="hud-card p-3 text-center"><div className="text-2xl font-bold font-mono text-nexus-text">{activas.length}</div><div className="text-nexus-muted text-xs font-mono">ACTIVAS</div></div>
        <div className={`hud-card p-3 text-center ${criticas.length > 0 ? 'border-red-600' : ''}`}><div className={`text-2xl font-bold font-mono ${criticas.length > 0 ? 'text-red-400' : 'text-nexus-text'}`}>{criticas.length}</div><div className="text-nexus-muted text-xs font-mono">CRITICAS</div></div>
        <div className="hud-card p-3 text-center"><div className="text-2xl font-bold font-mono text-nexus-green">{completas.length}</div><div className="text-nexus-muted text-xs font-mono">COMPLETADAS</div></div>
      </div>
      {criticas.length > 0 && (
        <div>
          <h3 className="text-red-400 text-xs font-mono uppercase tracking-widest mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Misiones Criticas ({criticas.length})</h3>
          <div className="space-y-3">{criticas.map(t => <MisionCard key={t.id} tarea={t} onComplete={completarTarea} onProgress={actualizarProgreso} />)}</div>
        </div>
      )}
      {otras.length > 0 && (
        <div>
          <h3 className="text-nexus-muted text-xs font-mono uppercase tracking-widest mb-2">Otras Misiones ({otras.length})</h3>
          <div className="space-y-3">{otras.map(t => <MisionCard key={t.id} tarea={t} onComplete={completarTarea} onProgress={actualizarProgreso} />)}</div>
        </div>
      )}
      {completas.length > 0 && (
        <div>
          <h3 className="text-nexus-muted text-xs font-mono uppercase tracking-widest mb-2">Completadas ({completas.length})</h3>
          <div className="space-y-3 opacity-70">{completas.map(t => <MisionCard key={t.id} tarea={t} onComplete={completarTarea} onProgress={actualizarProgreso} />)}</div>
        </div>
      )}
      {misTareas.length === 0 && (
        <div className="text-center py-16 text-nexus-muted">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-nexus-green opacity-50" />
          <p className="text-nexus-text mb-1">Espacio limpio.</p>
          <p className="text-nexus-muted text-sm">Cuando estés listo, define la siguiente acción. No hay prisa.</p>
        </div>
      )}
    </div>
  )
}
