import { FileText, X } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'

// Shown to Activos when they have unread SIRs
export default function SIRBanner() {
  const { currentUser, sirs, tasks, marcarSirLeido } = useNEXUS()
  if (!currentUser || currentUser.role === 'CORONEL') return null

  // SIRs directed to this activo
  const misSirs = sirs.filter(s =>
    s.activoDestino?.id === currentUser.id && !s.leido
  )
  if (misSirs.length === 0) return null

  return (
    <div className="space-y-2 mb-4">
      {misSirs.map(sir => (
        <div key={sir.id}
          className="flex items-start gap-3 p-4 rounded-lg border border-purple-500/60 bg-purple-900/20 animate-fade-in"
          style={{ boxShadow: '0 0 15px rgba(139,92,246,0.2)' }}>
          <FileText className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-purple-300 font-bold font-mono text-xs">{sir.id}</span>
              <span className="text-xs bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold">MISSION BRIEF</span>
            </div>
            <p className="text-nexus-text font-medium text-sm">
              Misión re-ruteada hacia ti: <span className="text-purple-300">{sir.tarea.titulo}</span>
            </p>
            <p className="text-nexus-muted text-xs mt-1">
              {sir.instrucciones[0]}
            </p>
          </div>
          <button onClick={() => marcarSirLeido(sir.id)} className="text-nexus-muted hover:text-nexus-text flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
