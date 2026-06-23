import { useEffect } from 'react'
import { Target } from 'lucide-react'
import { useNEXUS } from '../../../context/NEXUSContext'
import ActivoCard from '../ActivoCard'
import ActivoDetail from '../ActivoDetail'

/**
 * StandardHUD — vista por defecto del Squad Mode (custom-okr playbook).
 *
 * Es la extracción 1:1 del comportamiento histórico de CoronelHUD:
 * Sprint Goal banner + grid de ActivoCards + panel lateral ActivoDetail.
 *
 * Para Solo Mode el FocusMode mantiene su comportamiento original
 * cuando vistaHUD === 'standard' (este componente no se usa allí).
 */
export default function StandardHUD() {
  const { activosConSalud, selectedActivoId, setSelectedActivoId, sprintActivo, metricas } = useNEXUS()
  const activos = activosConSalud

  useEffect(() => {
    if (!selectedActivoId) return
    const onKey = (e) => { if (e.key === 'Escape') setSelectedActivoId(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedActivoId, setSelectedActivoId])

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className={`flex-1 overflow-y-auto p-4 transition-all duration-300 ${selectedActivoId ? 'hidden lg:block lg:max-w-[calc(100%-380px)]' : ''}`}>
        {sprintActivo && (
          <div className="surface-elevated p-3 mb-4 border-blue-700/40" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0))' }}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest">Sprint Goal</span>
                    <span className="text-blue-300 text-xs font-mono">{sprintActivo.nombre}</span>
                  </div>
                  <p className="text-nexus-text text-sm font-medium truncate">{sprintActivo.goal}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <div className="text-nexus-muted">Sprint progress</div>
                  <div className="text-nexus-text font-bold">{metricas.sprintProgreso}%</div>
                </div>
                <div className="text-right">
                  <div className="text-nexus-muted">Points</div>
                  <div className="text-nexus-text font-bold">{metricas.sprintPointsCompletados}/{metricas.sprintPointsTotal}</div>
                </div>
              </div>
            </div>
            <div className="mt-2 w-full bg-nexus-bg rounded-full h-1">
              <div className="h-1 rounded-full bg-blue-500 transition-all" style={{ width: `${metricas.sprintProgreso}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <div className="h-px flex-1 bg-nexus-border/50" />
          <span className="text-nexus-muted text-xs font-mono uppercase tracking-widest">Operators {activos.length}</span>
          <div className="h-px flex-1 bg-nexus-border/50" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 stagger-in">
          {activos.map(activo => <ActivoCard key={activo.id} activo={activo} />)}
        </div>
      </div>

      {selectedActivoId && (
        <div className="w-full lg:w-96 border-l border-nexus-border bg-nexus-surface overflow-y-auto flex-shrink-0">
          <ActivoDetail />
        </div>
      )}
    </div>
  )
}
