import { AlertTriangle, X, ChevronRight, Shield } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'
import { useState, useEffect, useMemo } from 'react'

export default function ModalCrisis() {
  const { modalCrisis, setModalCrisis, tasks, ejecutarReasignacion, obtenerCandidatosParaTarea, previewSIR } = useNEXUS()
  const [selectedTareaId, setSelectedTareaId]   = useState(null)
  const [selectedDestinoId, setSelectedDestinoId] = useState(null)
  const [step, setStep] = useState(1)

  const handleClose = () => {
    setModalCrisis(null)
    setSelectedTareaId(null)
    setSelectedDestinoId(null)
    setStep(1)
  }

  useEffect(() => {
    if (!modalCrisis) return
    const onKey = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalCrisis])

  const tareasCriticas = useMemo(
    () => modalCrisis ? tasks.filter(t =>
      t.activoId === modalCrisis.id &&
      t.estado !== 'COMPLETADA' &&
      (t.prioridad === 'CRITICA' || t.prioridad === 'ALTA')
    ) : [],
    [tasks, modalCrisis]
  )
  const selectedTarea = tareasCriticas.find(t => t.id === selectedTareaId)

  const candidatosContextuales = useMemo(
    () => selectedTarea ? obtenerCandidatosParaTarea(selectedTarea, modalCrisis?.id) : [],
    [selectedTarea, modalCrisis, obtenerCandidatosParaTarea]
  )
  const selectedDestino = candidatosContextuales.find(a => a.id === selectedDestinoId)

  if (!modalCrisis) return null

  const handleExecute = () => {
    if (selectedTareaId && selectedDestinoId) {
      ejecutarReasignacion(selectedTareaId, selectedDestinoId)
      setSelectedTareaId(null)
      setSelectedDestinoId(null)
      setStep(1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="modal-crisis-title">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-xl hud-card border-red-600 overflow-hidden animate-fade-in"
        style={{ boxShadow: '0 0 60px rgba(239,68,68,0.3), 0 0 20px rgba(239,68,68,0.1)' }}>

        <div className="bg-red-900/40 border-b border-red-700 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-axis-flare status-pulse" />
            <span id="modal-crisis-title" className="text-red-300 font-bold font-mono tracking-widest text-sm">
              Re-route en curso
            </span>
          </div>
          <button onClick={handleClose} aria-label="Cerrar modal de crisis" className="text-red-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-red-900/20 border border-red-700/50">
            <span className="text-3xl" aria-hidden="true">{modalCrisis.avatar}</span>
            <div className="flex-1">
              <div className="text-red-300 font-bold">{modalCrisis.nombre}</div>
              <div className="text-red-400/70 text-xs font-mono">{modalCrisis.codename} · SALUD: {modalCrisis.salud}%</div>
            </div>
            <div className="text-right text-xs font-mono">
              <div className="text-red-400">{modalCrisis.activas ?? 0} activas</div>
              <div className="text-red-300 font-bold">{modalCrisis.criticas ?? 0} críticas</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            {['Seleccionar Misión', 'Asignar Agente', 'Confirmar'].map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > i + 1 ? 'bg-nexus-green text-black' :
                  step === i + 1 ? 'bg-red-600 text-white' : 'bg-nexus-border text-nexus-muted'
                }`}>{i + 1}</span>
                <span className={step === i + 1 ? 'text-nexus-text' : 'text-nexus-muted'}>{s}</span>
                {i < 2 && <ChevronRight className="w-3 h-3 text-nexus-border" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div>
              <p className="text-nexus-muted text-xs font-mono mb-2 uppercase tracking-wider">
                PulseAI detectó {tareasCriticas.length} misión(es) en riesgo:
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {tareasCriticas.map(t => (
                  <button key={t.id} onClick={() => { setSelectedTareaId(t.id); setStep(2) }}
                    className={`w-full text-left p-3 rounded-md border transition-all ${
                      selectedTareaId === t.id ? 'border-red-500 bg-red-900/30'
                        : 'border-nexus-border bg-nexus-bg hover:border-red-500/50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-nexus-text text-sm font-medium">{t.titulo}</span>
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                        t.prioridad === 'CRITICA' ? 'text-red-400 bg-red-900/30 border border-red-700'
                          : 'text-yellow-400 bg-yellow-900/20 border border-yellow-700'}`}>{t.prioridad}</span>
                    </div>
                    <div className="text-nexus-muted text-xs mt-1">{t.progreso}% progreso</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedTarea && (
            <div>
              <div className="p-2 rounded bg-nexus-bg border border-nexus-border text-xs mb-3">
                <span className="text-nexus-muted">Misión: </span>
                <span className="text-nexus-text font-medium">{selectedTarea.titulo}</span>
              </div>
              <p className="text-nexus-muted text-xs font-mono mb-2 uppercase tracking-wider">
                RouteAI recomienda (score de idoneidad):
              </p>
              <div className="space-y-2">
                {candidatosContextuales.map((a, idx) => (
                  <button key={a.id} onClick={() => { setSelectedDestinoId(a.id); setStep(3) }}
                    className={`w-full text-left p-3 rounded-md border transition-all ${
                      selectedDestinoId === a.id ? 'border-nexus-green bg-nexus-green/10'
                        : 'border-nexus-border bg-nexus-bg hover:border-nexus-green/50'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">{a.avatar}</span>
                        <div>
                          <div className="text-nexus-text text-sm font-medium">{a.codename}</div>
                          <div className="text-nexus-muted text-xs">{a.especialidad} · {a.tareas} tareas activas</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold font-mono ${idx === 0 ? 'text-nexus-green' : 'text-nexus-muted'}`}>Score: {a.score}</div>
                        {idx === 0 && <div className="text-nexus-green text-xs">★ RECOMENDADO</div>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(1)} className="mt-2 text-nexus-muted text-xs hover:text-nexus-text underline">← Cambiar misión</button>
            </div>
          )}

          {step === 3 && selectedTarea && selectedDestino && (() => {
            const sirDraft = previewSIR(selectedTarea.id, selectedDestino.id)
            return (
              <div className="space-y-3">
                <div className="p-4 rounded-md bg-nexus-bg border border-nexus-green/50 space-y-2">
                  <div className="flex items-center gap-2 text-nexus-green font-mono text-sm font-bold">
                    <Shield className="w-4 h-4" />RESUMEN DEL RE-ROUTING
                  </div>
                  <div className="text-xs space-y-1 text-nexus-muted font-mono">
                    <div>MISIÓN: <span className="text-nexus-text">{selectedTarea.titulo}</span></div>
                    <div>DE: <span className="text-red-400">{modalCrisis.codename}</span></div>
                    <div>A: <span className="text-nexus-green">{selectedDestino.codename}</span></div>
                  </div>
                </div>

                {sirDraft && (
                  <div className="p-3 rounded-md bg-purple-900/10 border border-purple-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-purple-300 font-mono text-xs font-bold uppercase tracking-widest">
                        <Shield className="w-3.5 h-3.5" />SIR — Vista previa
                      </div>
                      <span className="text-purple-400/70 text-xs font-mono">DRAFT</span>
                    </div>
                    <ol className="space-y-1.5 text-xs text-nexus-muted leading-relaxed">
                      {sirDraft.instrucciones.map((linea, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-purple-400/70 font-mono flex-shrink-0">{(i + 1).toString().padStart(2, '0')}</span>
                          <span>{linea}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <button onClick={() => setStep(2)} className="text-nexus-muted text-xs hover:text-nexus-text underline">← Cambiar agente</button>
              </div>
            )
          })()}

          <div className="flex gap-2 pt-2 border-t border-nexus-border">
            <button onClick={handleClose} className="hud-btn-ghost flex-1">Cancelar</button>
            {step === 3 && selectedTareaId && selectedDestinoId ? (
              <button onClick={handleExecute}
                className="flex-1 py-2 rounded-md font-bold text-sm text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
                ⚡ EJECUTAR RE-ROUTING + GENERAR MISSION BRIEF
              </button>
            ) : (
              <div className="flex-1 py-2 rounded-md bg-nexus-border/20 text-nexus-muted text-sm text-center font-mono">
                {step === 1 ? 'Selecciona la misión a re-rutear →' : step === 2 ? 'Selecciona un agente →' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
