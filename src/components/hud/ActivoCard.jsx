import { useNEXUS } from '../../context/NEXUSContext'

const LEVEL_STYLES = {
  CHARLIE: { border: 'border-red-500',    bg: 'bg-red-900/20',    dot: 'bg-red-500',    text: 'text-red-400',    label: 'CRISIS',     pulse: true  },
  BRAVO:   { border: 'border-yellow-500', bg: 'bg-yellow-900/10', dot: 'bg-yellow-500', text: 'text-yellow-400', label: 'SOBRECARGA', pulse: false },
  NOMINAL: { border: 'border-nexus-border', bg: '',                dot: 'bg-nexus-green', text: 'text-nexus-green', label: 'OPERATIVO', pulse: false },
}

export default function ActivoCard({ activo }) {
  const { selectedActivoId, setSelectedActivoId, setModalCrisis } = useNEXUS()
  const isSelected = selectedActivoId === activo.id
  const style = LEVEL_STYLES[activo.alertLevel] || LEVEL_STYLES.NOMINAL

  const handleClick = () => setSelectedActivoId(isSelected ? null : activo.id)
  const handleCrisis = (e) => { e.stopPropagation(); setModalCrisis(activo) }
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const completadas  = activo.tareas.filter(t => t.estado === 'COMPLETADA').length
  const total        = activo.tareas.length
  const barra        = total > 0 ? Math.round((completadas / total) * 100) : 0

  return (
    <div onClick={handleClick} onKeyDown={handleKey} role="button" tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Activo ${activo.nombre}, codename ${activo.codename}, estado ${style.label}, salud ${activo.salud} por ciento`}
      className={`hud-card p-4 cursor-pointer transition-all duration-300 select-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-nexus-bg ${style.border} ${style.bg} ${isSelected ? 'ring-2 ring-blue-500 scale-[1.02]' : 'hover:scale-[1.01] hover:border-blue-500/50'} ${activo.alertLevel === 'CHARLIE' ? 'crisis-pulse' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label={activo.codename}>{activo.avatar}</span>
          <div>
            <div className="text-nexus-text font-semibold text-sm leading-tight">{activo.nombre}</div>
            <div className="text-nexus-muted text-xs font-mono">{activo.codename}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs font-mono font-bold ${style.text}`}>
          <span className={`status-dot ${style.dot} ${style.pulse ? 'animate-blink' : ''}`} />{style.label}
        </div>
      </div>
      <div className="text-nexus-muted text-xs mb-3 truncate">{activo.especialidad}</div>
      <div className="flex justify-between text-xs text-nexus-muted mb-2">
        <span>{activo.activas ?? 0} <span className="text-nexus-muted/60">activas</span></span>
        <span>{activo.criticas ?? 0} <span className="text-red-400/80">criticas</span></span>
        <span>{completadas}/{total} <span className="text-nexus-muted/60">ok</span></span>
      </div>
      <div className="w-full bg-nexus-bg rounded-full h-1.5 mb-3">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${barra}%`, background: activo.alertLevel === 'CHARLIE' ? '#ef4444' : activo.alertLevel === 'BRAVO' ? '#f59e0b' : '#10b981' }} />
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-nexus-muted font-mono">SALUD: <span className={`font-bold ${style.text}`}>{activo.salud}%</span></div>
        {activo.alertLevel === 'CHARLIE' && (
          <button onClick={handleCrisis} aria-label={`Activar Protocolo Charlie para ${activo.codename}`}
            className="text-xs font-bold px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-red-300">
            PROTOCOLO CHARLIE
          </button>
        )}
      </div>
    </div>
  )
}
