import { useMemo, useState } from 'react'
import { Target, TrendingUp, TrendingDown, ChevronDown, ChevronRight, Sparkles, User, Calendar, Link2, Plus } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'
import QuickForm from '../ui/QuickForm'

/**
 * StrategyView — OKR Tree
 * Materializa el layer 4 (Strategy) del Execution OS:
 * Objectives → Key Results → Misiones vinculadas
 *
 * RBAC: solo Director ve esta vista. La verificación se hace al routing.
 */
export default function StrategyView() {
  const { objectives, keyResults, tasks, ACTIVOS_CREDENTIALS, sprintActivo, crearObjective, agregarKR } = useNEXUS()
  const [expanded, setExpanded] = useState(() => new Set(objectives.map(o => o.id)))
  const [newObjOpen, setNewObjOpen] = useState(false)
  const [newKrForObj, setNewKrForObj] = useState(null)  // objective id

  const handleCreateObjective = (vals) => {
    crearObjective(vals.titulo, vals.descripcion, vals.periodo, vals.ownerId)
  }

  const handleCreateKR = (vals) => {
    if (!newKrForObj) return
    agregarKR(newKrForObj, vals.titulo, vals.metrica, Number(vals.target), vals.unit, vals.trend)
  }

  const periodActual = (() => {
    const m = new Date().getMonth() + 1
    const q = Math.ceil(m / 3)
    const y = new Date().getFullYear()
    return `Q${q}-${y}`
  })()

  const toggle = (id) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // Stats globales
  const stats = useMemo(() => {
    const krsActivos   = keyResults.length
    const objActivos   = objectives.filter(o => o.estado === 'ACTIVE').length
    const misVinc      = tasks.filter(t => t.keyResultId).length
    const misVincSprint = tasks.filter(t => t.keyResultId && t.sprintId === sprintActivo?.id).length
    const avgProgress = krsActivos > 0
      ? Math.round(keyResults.reduce((s, k) => s + k.progresoMetrica, 0) / krsActivos)
      : 0
    return { krsActivos, objActivos, misVinc, misVincSprint, avgProgress }
  }, [keyResults, objectives, tasks, sprintActivo])

  if (objectives.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="mesh-bg rounded-xl p-12">
          <Target className="w-12 h-12 mx-auto text-blue-400/50 mb-4" />
          <h2 className="text-nexus-text text-lg font-semibold mb-2">Sin objetivos definidos</h2>
          <p className="text-nexus-muted text-sm max-w-md mx-auto">
            Define el primer Objective trimestral para empezar a vincular misiones a resultados estratégicos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-nexus-muted text-xs font-mono uppercase tracking-widest">
            <Target className="w-3 h-3" />Strategy Layer
          </div>
          <h1 className="text-nexus-text text-2xl font-bold mt-1">Objetivos &amp; Key Results</h1>
          <p className="text-nexus-muted text-sm">Lo que define a dónde vamos. Las misiones existen para mover estos números.</p>
        </div>
        <button onClick={() => setNewObjOpen(true)}
          className="hud-btn-primary text-xs flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />Nuevo Objective
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="surface-card p-3">
          <div className="text-nexus-muted text-xs font-mono">Objectives activos</div>
          <div className="text-nexus-text text-2xl font-bold font-mono mt-1">{stats.objActivos}</div>
        </div>
        <div className="surface-card p-3">
          <div className="text-nexus-muted text-xs font-mono">Key Results</div>
          <div className="text-nexus-text text-2xl font-bold font-mono mt-1">{stats.krsActivos}</div>
        </div>
        <div className="surface-card p-3">
          <div className="text-nexus-muted text-xs font-mono">Misiones vinculadas</div>
          <div className="text-nexus-text text-2xl font-bold font-mono mt-1">
            {stats.misVinc}
            <span className="text-nexus-muted text-sm ml-2">({stats.misVincSprint} en sprint)</span>
          </div>
        </div>
        <div className="surface-card p-3">
          <div className="text-nexus-muted text-xs font-mono">Progreso promedio</div>
          <div className={`text-2xl font-bold font-mono mt-1 ${
            stats.avgProgress >= 70 ? 'text-nexus-green' :
            stats.avgProgress >= 40 ? 'text-yellow-400' : 'text-red-400'
          }`}>{stats.avgProgress}%</div>
        </div>
      </div>

      {/* Objectives */}
      <div className="space-y-3 stagger-in">
        {objectives.map(obj => {
          const isOpen = expanded.has(obj.id)
          const krs = keyResults.filter(kr => kr.objectiveId === obj.id)
          const owner = ACTIVOS_CREDENTIALS.find(a => a.id === obj.ownerId)
          const avg = krs.length > 0
            ? Math.round(krs.reduce((s, k) => s + k.progresoMetrica, 0) / krs.length)
            : 0
          return (
            <ObjectiveCard
              key={obj.id}
              objective={obj}
              krs={krs}
              owner={owner}
              avg={avg}
              isOpen={isOpen}
              onToggle={() => toggle(obj.id)}
              tasks={tasks}
              activos={ACTIVOS_CREDENTIALS}
              onAddKR={() => setNewKrForObj(obj.id)}
            />
          )
        })}
      </div>

      <QuickForm
        open={newObjOpen}
        onClose={() => setNewObjOpen(false)}
        title="Nuevo Objective"
        submitLabel="Crear Objective"
        onSubmit={handleCreateObjective}
        fields={[
          { name: 'titulo',      label: 'Título',      type: 'text',     required: true, placeholder: 'Reducir tiempo de respuesta a incidentes' },
          { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Contexto y narrativa del objetivo...' },
          { name: 'periodo',     label: 'Periodo',     type: 'text',     required: true, defaultValue: periodActual, placeholder: 'Q3-2026' },
          { name: 'ownerId',     label: 'Owner',       type: 'select',   required: true,
            defaultValue: ACTIVOS_CREDENTIALS[0]?.id,
            options: ACTIVOS_CREDENTIALS.map(a => ({ value: a.id, label: `${a.codename} · ${a.nombre}` }))
          },
        ]}
      />

      <QuickForm
        open={!!newKrForObj}
        onClose={() => setNewKrForObj(null)}
        title="Nuevo Key Result"
        submitLabel="Agregar KR"
        onSubmit={handleCreateKR}
        fields={[
          { name: 'titulo',  label: 'Título',  type: 'text',   required: true, placeholder: 'MTTR menor a 4 horas' },
          { name: 'metrica', label: 'Métrica', type: 'text',   required: true, placeholder: 'MTTR, NPS, Cobertura...' },
          { name: 'target',  label: 'Target',  type: 'number', required: true, defaultValue: 100, step: '0.01' },
          { name: 'unit',    label: 'Unidad',  type: 'select', defaultValue: '%',
            options: [
              { value: '%', label: 'Porcentaje (%)' },
              { value: 'h', label: 'Horas (h)' },
              { value: 'pts', label: 'Puntos (pts)' },
              { value: 'count', label: 'Conteo' },
              { value: '$', label: 'Moneda ($)' },
            ]
          },
          { name: 'trend', label: 'Dirección deseada', type: 'select', defaultValue: 'UP',
            options: [
              { value: 'UP',   label: 'Más es mejor (UP)' },
              { value: 'DOWN', label: 'Menos es mejor (DOWN)' },
            ]
          },
        ]}
      />
    </div>
  )
}

function ObjectiveCard({ objective, krs, owner, avg, isOpen, onToggle, tasks, activos, onAddKR }) {
  const statusColor = avg >= 70 ? 'text-nexus-green' : avg >= 40 ? 'text-yellow-400' : 'text-red-400'
  const statusBg    = avg >= 70 ? 'bg-nexus-green' : avg >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="surface-elevated overflow-hidden">
      {/* Header */}
      <button onClick={onToggle} aria-expanded={isOpen}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-nexus-bg/40 transition-colors focus-ring">
        <div className="mt-1 flex-shrink-0 text-nexus-muted">
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
        <Target className={`w-5 h-5 flex-shrink-0 mt-0.5 ${statusColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono text-nexus-muted mb-1">
            <span className="uppercase tracking-widest">Objective</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{objective.periodo}</span>
            {owner && <>
              <span>·</span>
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{owner.codename}</span>
            </>}
          </div>
          <h2 className="text-nexus-text text-base font-semibold leading-tight">{objective.titulo}</h2>
          <p className="text-nexus-muted text-sm mt-1 line-clamp-2">{objective.descripcion}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          <div className={`text-2xl font-bold font-mono ${statusColor}`}>{avg}%</div>
          <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest">avg progress</div>
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-4 -mt-2">
        <div className="w-full bg-nexus-bg rounded-full h-1">
          <div className={`h-1 rounded-full ${statusBg} transition-all`} style={{ width: `${avg}%` }} />
        </div>
      </div>

      {/* KRs */}
      {isOpen && (
        <div className="border-t border-nexus-border bg-nexus-bg/30 p-4 space-y-3">
          {krs.length === 0 ? (
            <div className="text-center py-6 text-nexus-muted text-sm">
              Sin Key Results. Agrega al menos uno para hacer este objetivo medible.
            </div>
          ) : (
            krs.map(kr => <KRRow key={kr.id} kr={kr} tasks={tasks} activos={activos} />)
          )}
          <button onClick={onAddKR}
            className="w-full py-2 rounded border border-dashed border-nexus-border text-nexus-muted hover:border-blue-500 hover:text-blue-300 text-xs font-mono transition-colors flex items-center justify-center gap-1.5">
            <Plus className="w-3 h-3" />Agregar Key Result
          </button>
        </div>
      )}
    </div>
  )
}

function KRRow({ kr, tasks, activos }) {
  const [showMisiones, setShowMisiones] = useState(false)
  const misionesVinc = tasks.filter(t => t.keyResultId === kr.id)
  const completadas = misionesVinc.filter(t => t.estado === 'COMPLETADA').length

  const prog = kr.progresoMetrica
  const color = prog >= 70 ? 'text-nexus-green' : prog >= 40 ? 'text-yellow-400' : 'text-red-400'
  const bgColor = prog >= 70 ? 'bg-nexus-green' : prog >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  const TrendIcon = kr.trend === 'UP' ? TrendingUp : TrendingDown

  return (
    <div className="rounded-md border border-nexus-border bg-nexus-surface p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-blue-300 bg-blue-900/20 border border-blue-700/40 px-1.5 py-0.5 rounded">KR</span>
            <TrendIcon className={`w-3 h-3 ${color}`} aria-hidden="true" />
            <span className="text-nexus-muted text-xs font-mono">{kr.metrica}</span>
          </div>
          <h3 className="text-nexus-text text-sm font-medium">{kr.titulo}</h3>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-sm font-bold font-mono ${color}`}>
            {kr.current}<span className="text-nexus-muted text-xs"> / {kr.target}{kr.unit}</span>
          </div>
          <div className="text-[10px] font-mono text-nexus-muted">{prog}% al target</div>
        </div>
      </div>

      <div className="w-full bg-nexus-bg rounded-full h-1.5 mb-3">
        <div className={`h-1.5 rounded-full ${bgColor} transition-all duration-500`} style={{ width: `${prog}%` }} />
      </div>

      <div className="flex items-center justify-between text-xs">
        <button onClick={() => setShowMisiones(s => !s)}
          aria-expanded={showMisiones}
          className="flex items-center gap-1 text-nexus-muted hover:text-blue-300 font-mono transition-colors">
          <Link2 className="w-3 h-3" />
          {misionesVinc.length} misión(es) vinculadas{misionesVinc.length > 0 && ` · ${completadas} completas`}
          {showMisiones ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        <span className="ai-chip"><Sparkles className="w-2.5 h-2.5" />AI</span>
      </div>

      {showMisiones && (
        <div className="mt-3 pt-3 border-t border-nexus-border space-y-1.5">
          {misionesVinc.length === 0 ? (
            <p className="text-nexus-muted text-xs italic">Aún sin misiones que muevan este KR.</p>
          ) : (
            misionesVinc.map(t => {
              const owner = activos.find(a => a.id === t.activoId)
              return (
                <div key={t.id} className="flex items-center gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    t.estado === 'COMPLETADA' ? 'bg-nexus-green' :
                    t.prioridad === 'CRITICA'   ? 'bg-red-500' :
                    t.prioridad === 'ALTA'      ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-nexus-text truncate flex-1">{t.titulo}</span>
                  <span className="text-nexus-muted font-mono">{t.progreso}%</span>
                  {owner && <span className="text-nexus-muted font-mono text-[10px]">{owner.codename}</span>}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
