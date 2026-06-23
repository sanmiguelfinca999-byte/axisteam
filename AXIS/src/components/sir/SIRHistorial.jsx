import { FileText, CheckCircle, Clock, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useState } from 'react'
import { useNEXUS } from '../../context/NEXUSContext'

function SIRCard({ sir, onRead }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`hud-card border transition-all duration-200 ${
      sir.leido ? 'border-nexus-border opacity-70' : 'border-purple-500/50 bg-purple-900/10'
    }`}>
      <div
        className="flex items-start justify-between p-4 cursor-pointer"
        onClick={() => { setExpanded(e => !e); if (!sir.leido) onRead(sir.id) }}
      >
        <div className="flex items-start gap-3">
          <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${sir.leido ? 'text-nexus-muted' : 'text-purple-400'}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-mono text-xs font-bold">{sir.id}</span>
              {!sir.leido && (
                <span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold">NUEVO</span>
              )}
            </div>
            <p className="text-nexus-text text-sm font-medium mt-0.5">{sir.tarea.titulo}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-nexus-muted font-mono">
              <span className="text-red-400">{sir.activoOrigen.codename}</span>
              <span>→</span>
              <span className="text-nexus-green">{sir.activoDestino.codename}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(sir.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {sir.leido ? <CheckCircle className="w-4 h-4 text-nexus-muted" /> : null}
          {expanded ? <ChevronUp className="w-4 h-4 text-nexus-muted" /> : <ChevronDown className="w-4 h-4 text-nexus-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-nexus-border px-4 pb-4 pt-3 space-y-3 animate-fade-in">
          {/* Instrucciones */}
          <div>
            <span className="text-nexus-muted text-xs font-mono uppercase tracking-wider block mb-2">
              Set de Instrucciones de Recuperación
            </span>
            <ul className="space-y-2">
              {sir.instrucciones.map((inst, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-purple-400 font-mono text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span className="text-nexus-text/90">{inst}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tarea info */}
          <div className="grid grid-cols-3 gap-2 text-xs p-3 bg-nexus-bg rounded border border-nexus-border">
            <div>
              <div className="text-nexus-muted font-mono">PRIORIDAD</div>
              <div className={`font-bold ${sir.tarea.prioridad === 'CRITICA' ? 'text-red-400' : 'text-yellow-400'}`}>
                {sir.tarea.prioridad}
              </div>
            </div>
            <div>
              <div className="text-nexus-muted font-mono">PROGRESO</div>
              <div className="font-bold text-nexus-text">{sir.tarea.progreso}%</div>
            </div>
            <div>
              <div className="text-nexus-muted font-mono">ESTADO</div>
              <div className="font-bold text-purple-400">{sir.estado}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SIRHistorial() {
  const { sirs, marcarSirLeido } = useNEXUS()
  const [filtro, setFiltro] = useState('all') // all | nuevos | leidos

  const filtrados = sirs.filter(s =>
    filtro === 'all'    ? true :
    filtro === 'nuevos' ? !s.leido :
    filtro === 'leidos' ? s.leido : true
  )

  return (
    <div className="p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-purple-400" />
          <h2 className="text-nexus-text font-bold text-sm tracking-widest uppercase">Historial SIRs</h2>
          {sirs.filter(s => !s.leido).length > 0 && (
            <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">
              {sirs.filter(s => !s.leido).length}
            </span>
          )}
        </div>
        {/* Filtros */}
        <div className="flex gap-1">
          {[['all','Todos'],['nuevos','Nuevos'],['leidos','Leídos']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFiltro(val)}
              className={`text-xs px-2 py-1 rounded font-mono transition-colors ${
                filtro === val
                  ? 'bg-purple-600 text-white'
                  : 'bg-nexus-bg border border-nexus-border text-nexus-muted hover:text-nexus-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-center py-12 text-nexus-muted">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-mono">
            {sirs.length === 0
              ? 'No hay SIRs generados. Ejecuta el Protocolo Charlie para crear el primero.'
              : 'No hay SIRs en esta categoría.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(sir => (
            <SIRCard key={sir.id} sir={sir} onRead={marcarSirLeido} />
          ))}
        </div>
      )}
    </div>
  )
}
