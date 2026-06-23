import { useMemo } from 'react'
import { Layers, AlertTriangle, CheckCircle2, Activity, Plus } from 'lucide-react'
import { useNEXUS } from '../../../context/NEXUSContext'

/**
 * MultiTrackHUD — vista de tracks horizontales para el playbook admin-multifaceted.
 *
 * Cada track del diagnóstico se muestra como columna kanban-lite con 3 carriles:
 *   Pendientes (0%) · En curso (1-99%) · Cerradas (100%)
 *
 * Las misiones se asignan a un track via keyword match (titulo + descripcion).
 * Las que no encajan caen en "Sin frente". Si no hay tracks en el diagnóstico,
 * se usan los defaults del playbook: Operación / Estrategia / Personas.
 */

const TRACKS_DEFAULT = ['Operación', 'Estrategia', 'Personas']
const TRACK_FALLBACK = 'Sin frente'

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const matchTrack = (tarea, tracksNorm) => {
  const haystack = norm(`${tarea.titulo} ${tarea.descripcion}`)
  for (const { original, normed } of tracksNorm) {
    if (haystack.includes(normed)) return original
    // Match por sinónimos básicos
    if (normed === 'personas' && /equipo|gente|talento|hr|recurs/.test(haystack)) return original
    if (normed === 'operacion' && /ops|operativ|backoffice|proceso/.test(haystack)) return original
    if (normed === 'estrategia' && /strateg|vision|plan trimestral|objetivo|okr/.test(haystack)) return original
    if (normed === 'finanzas' && /budget|presupuesto|gasto|cobro|factur/.test(haystack)) return original
    if (normed === 'producto' && /feature|backlog|sprint|release/.test(haystack)) return original
  }
  return TRACK_FALLBACK
}

function MisionMini({ tarea }) {
  const vencida = new Date(tarea.fechaLimite) < new Date() && tarea.estado !== 'COMPLETADA'
  const due = new Date(tarea.fechaLimite).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  const prioColor =
    tarea.prioridad === 'CRITICA' ? '#ef4444'
      : tarea.prioridad === 'ALTA' ? '#f59e0b'
        : '#3b82f6'
  return (
    <div
      className="hud-card p-2 mb-1.5 border"
      style={{ borderColor: vencida ? '#ef4444' : 'rgba(255,255,255,0.08)' }}
      title={tarea.descripcion}
    >
      <div className="flex items-start gap-2">
        <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: prioColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-nexus-text text-xs font-medium leading-snug truncate">{tarea.titulo}</p>
          <div className="flex items-center justify-between text-[10px] font-mono text-nexus-muted gap-1">
            <span className={vencida ? 'text-red-400' : ''}>{due}</span>
            {tarea.estado !== 'COMPLETADA' && <span className="text-nexus-text/80 font-semibold">{tarea.progreso}%</span>}
            {tarea.estado === 'COMPLETADA' && <CheckCircle2 className="w-3 h-3 text-nexus-green" />}
          </div>
        </div>
      </div>
    </div>
  )
}

function Carril({ label, count, accent, children }) {
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: accent }}>{label}</span>
        <span className="text-[10px] font-mono text-nexus-muted">{count}</span>
      </div>
      <div className="min-h-[60px]">
        {children}
      </div>
    </div>
  )
}

function TrackCol({ track, tareas, onCompose, isFallback }) {
  const pendientes = tareas.filter(t => (t.progreso ?? 0) <= 0 && t.estado !== 'COMPLETADA')
  const enCurso    = tareas.filter(t => (t.progreso ?? 0) > 0 && t.estado !== 'COMPLETADA')
  const cerradas   = tareas.filter(t => t.estado === 'COMPLETADA')
  const desatendido = tareas.length === 0 && !isFallback

  return (
    <div className={`min-w-[240px] flex-1 surface-card p-3 ${desatendido ? 'border-yellow-700/40' : ''}`}>
      <header className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <h3 className="text-nexus-text text-sm font-semibold truncate">{track}</h3>
          <span className="text-[10px] font-mono text-nexus-muted bg-nexus-bg/60 border border-nexus-border px-1.5 py-0.5 rounded flex-shrink-0">{tareas.length}</span>
        </div>
        {onCompose && (
          <button
            onClick={() => onCompose(track)}
            className="text-nexus-muted hover:text-blue-300 transition-colors p-1 rounded hover:bg-nexus-bg/60"
            title={`Crear misión en ${track}`}
            aria-label={`Crear misión en ${track}`}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      {desatendido && (
        <div className="text-[10px] text-yellow-300 flex items-center gap-1 mb-2 font-mono">
          <AlertTriangle className="w-3 h-3" /> frente desatendido
        </div>
      )}

      <div className="space-y-3">
        <Carril label="Pendientes" count={pendientes.length} accent="#7A8AB8">
          {pendientes.map(t => <MisionMini key={t.id} tarea={t} />)}
        </Carril>
        <Carril label="En curso" count={enCurso.length} accent="#5B8DEF">
          {enCurso.map(t => <MisionMini key={t.id} tarea={t} />)}
        </Carril>
        {cerradas.length > 0 && (
          <Carril label="Cerradas" count={cerradas.length} accent="#22D3A8">
            <div className="opacity-60">{cerradas.slice(0, 3).map(t => <MisionMini key={t.id} tarea={t} />)}</div>
            {cerradas.length > 3 && <p className="text-[10px] text-nexus-muted font-mono text-center">+{cerradas.length - 3} más</p>}
          </Carril>
        )}
      </div>
    </div>
  )
}

export default function MultiTrackHUD() {
  const { tasks, currentUser, axisMode, isDirector, userPlaybook } = useNEXUS()
  const isSolo = axisMode === 'solo'

  const tracks = useMemo(() => {
    const fromDiag = userPlaybook?.diagnostico?.tracks
    if (Array.isArray(fromDiag) && fromDiag.length > 0) return fromDiag
    return TRACKS_DEFAULT
  }, [userPlaybook])

  const tracksNorm = useMemo(
    () => tracks.map(t => ({ original: t, normed: norm(t) })),
    [tracks]
  )

  const scoped = useMemo(() => {
    if (!isSolo) return tasks
    if (!currentUser) return []
    return tasks.filter(t => t.activoId === currentUser.id)
  }, [tasks, isSolo, currentUser])

  const porTrack = useMemo(() => {
    const map = Object.fromEntries(tracks.map(t => [t, []]))
    map[TRACK_FALLBACK] = []
    for (const t of scoped) {
      const target = matchTrack(t, tracksNorm)
      if (!map[target]) map[target] = []
      map[target].push(t)
    }
    return map
  }, [scoped, tracks, tracksNorm])

  const totales = useMemo(() => ({
    tracks: tracks.length,
    desatendidos: tracks.filter(t => porTrack[t].length === 0).length,
    total: scoped.length,
    activas: scoped.filter(t => t.estado !== 'COMPLETADA').length,
  }), [tracks, porTrack, scoped])

  const handleCompose = (track) => {
    window.dispatchEvent(new CustomEvent('axis:composer:open', {
      detail: { defaults: { titulo: `[${track}] `, descripcion: `Track: ${track}\n\n` } },
    }))
  }

  if (scoped.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-nexus-muted text-sm p-8 text-center">
        <div className="max-w-sm">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-nexus-text mb-1">Frentes en blanco.</p>
          <p className="text-xs leading-relaxed">Empieza mapeando los tracks que cargas hoy. Una acción pequeña por frente y el sistema se enciende.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <header className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-nexus-text text-lg font-bold tracking-tight">Multi-track {userPlaybook?.nombre ? <span className="text-nexus-muted font-mono text-sm font-normal ml-2">// {userPlaybook.nombre}</span> : null}</h2>
          <p className="text-nexus-muted text-xs font-mono">{isSolo ? 'Tus frentes' : 'Frentes del equipo'} — {tracks.length} track{tracks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <Stat icon={Layers} label="Tracks" value={totales.tracks} />
          <Stat icon={Activity} label="Activas" value={totales.activas} />
          {totales.desatendidos > 0 && (
            <Stat icon={AlertTriangle} label="Desatendidos" value={totales.desatendidos} accent="#FFB547" />
          )}
        </div>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-3 items-stretch stagger-in">
        {tracks.map(track => (
          <TrackCol
            key={track}
            track={track}
            tareas={porTrack[track]}
            onCompose={isDirector ? handleCompose : null}
          />
        ))}
        {porTrack[TRACK_FALLBACK].length > 0 && (
          <TrackCol
            track={TRACK_FALLBACK}
            tareas={porTrack[TRACK_FALLBACK]}
            isFallback
          />
        )}
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-nexus-muted" />
      <div className="text-right">
        <div className="text-nexus-muted text-[10px] uppercase tracking-widest">{label}</div>
        <div className="text-nexus-text font-bold text-base" style={accent ? { color: accent } : {}}>{value}</div>
      </div>
    </div>
  )
}
