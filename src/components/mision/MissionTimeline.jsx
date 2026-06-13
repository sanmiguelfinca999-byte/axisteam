import { useState } from 'react'
import { Clock, MessageSquare, Send, ArrowRightLeft, CheckCircle2, FileText, Sparkles } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'

const EVENT_STYLES = {
  CREATED:    { icon: Sparkles,       color: 'text-blue-300',    border: 'border-blue-700',    label: 'Creada' },
  REASIGNADA: { icon: ArrowRightLeft, color: 'text-purple-300',  border: 'border-purple-700',  label: 'Reasignada' },
  COMPLETED:  { icon: CheckCircle2,   color: 'text-nexus-green', border: 'border-green-700',   label: 'Completada' },
  COMMENT:    { icon: MessageSquare,  color: 'text-nexus-text',  border: 'border-nexus-border',label: 'Comentario' },
  PROGRESO:   { icon: FileText,       color: 'text-yellow-300',  border: 'border-yellow-700',  label: 'Progreso' },
}

function formatRelative(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60)      return `hace ${s}s`
  if (s < 3600)    return `hace ${Math.floor(s / 60)}m`
  if (s < 86400)   return `hace ${Math.floor(s / 3600)}h`
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function EventRow({ ev }) {
  const style = EVENT_STYLES[ev.tipo] || EVENT_STYLES.COMMENT
  const Icon = style.icon
  return (
    <div className={`flex gap-3 p-2 rounded border ${style.border} bg-nexus-bg/40`}>
      <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${style.color}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 text-xs font-mono">
          <span className={`font-bold ${style.color}`}>{style.label}</span>
          <span className="text-nexus-muted">{formatRelative(ev.timestamp)}</span>
        </div>
        <div className="text-xs text-nexus-muted mt-0.5">
          <span className="font-mono">{ev.autor}</span>
          {ev.tipo === 'REASIGNADA' && ev.payload?.de && ev.payload?.a && (
            <> · <span className="text-purple-300">{ev.payload.de}</span> → <span className="text-nexus-green">{ev.payload.a}</span></>
          )}
          {ev.tipo === 'REASIGNADA' && ev.payload?.sirId && (
            <> · SIR <span className="text-purple-300">{ev.payload.sirId}</span></>
          )}
        </div>
        {ev.tipo === 'COMMENT' && ev.payload?.texto && (
          <p className="mt-1 text-sm text-nexus-text whitespace-pre-wrap break-words">{ev.payload.texto}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Timeline + Comments para una misión.
 * @param {Object} tarea - la tarea con .eventos[]
 * @param {boolean} canComment - si el usuario actual puede comentar (default: true)
 */
export default function MissionTimeline({ tarea, canComment = true }) {
  const { agregarComentario, currentUser } = useNEXUS()
  const [draft, setDraft] = useState('')

  const eventos = (tarea?.eventos || []).slice().sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    agregarComentario(tarea.id, draft)
    setDraft('')
  }

  return (
    <div className="mt-3 pt-3 border-t border-nexus-border space-y-3">
      <div className="flex items-center gap-2 text-xs text-nexus-muted font-mono uppercase tracking-widest">
        <Clock className="w-3 h-3" />
        Historial · {eventos.length} {eventos.length === 1 ? 'evento' : 'eventos'}
      </div>

      {canComment && currentUser && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Agregar comentario..."
            maxLength={500}
            aria-label="Comentario en esta misión"
            className="flex-1 bg-nexus-bg border border-nexus-border rounded px-3 py-1.5 text-sm text-nexus-text placeholder-nexus-muted/60 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Enviar comentario"
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-1 text-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}

      {eventos.length === 0 ? (
        <p className="text-nexus-muted text-xs italic text-center py-3">
          Sin eventos. Las acciones sobre esta misión aparecerán aquí.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {eventos.map(ev => <EventRow key={ev.id} ev={ev} />)}
        </div>
      )}
    </div>
  )
}
