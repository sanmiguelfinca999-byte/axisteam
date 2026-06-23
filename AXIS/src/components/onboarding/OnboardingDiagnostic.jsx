import { useState, useMemo } from 'react'
import { ChevronRight, ChevronLeft, Target, Compass, Clock, AlertTriangle, Sparkles, CheckCircle, Users, User as UserIcon } from 'lucide-react'
import { PLAYBOOK_OPTIONS, deployPlaybook } from '../../lib/playbookEngine'

// ============================================================
// AXIS Onboarding Diagnostic
// ------------------------------------------------------------
// Wizard de 7 pasos que captura el contexto del usuario y
// resuelve un Playbook personalizado. NO impone — sugiere.
// El usuario revisa el preview y confirma. Solo entonces se
// despliega (Objective + KRs + Misiones iniciales).
// ============================================================

const STEPS = [
  { id: 'dominio',    titulo: '¿En qué arena estás peleando?',     icon: Compass    },
  { id: 'meta',       titulo: 'La meta específica',                 icon: Target     },
  { id: 'porQue',     titulo: 'Por qué importa',                    icon: Sparkles   },
  { id: 'medicion',   titulo: 'Cómo medirás éxito',                 icon: CheckCircle },
  { id: 'tiempo',     titulo: 'Tiempo real semanal',                icon: Clock      },
  { id: 'freno',      titulo: 'Qué te ha frenado antes',            icon: AlertTriangle },
  { id: 'modo',       titulo: '¿Solo o con equipo?',                icon: Users      },
]

const TIEMPO_OPTS = ['< 3 h', '3 a 7 h', '8 a 14 h', '15 a 25 h', '> 25 h']
const FRENO_OPTS  = [
  { id: 'metodo',     label: 'Falta de método claro' },
  { id: 'claridad',   label: 'Falta de claridad en la meta' },
  { id: 'disciplina', label: 'Disciplina / consistencia' },
  { id: 'tiempo',     label: 'Falta de tiempo real' },
  { id: 'recursos',   label: 'Falta de recursos / dinero / red' },
  { id: 'miedo',      label: 'Miedo al fracaso o a empezar' },
]
const MODO_OPTS = [
  { id: 'solo',  label: 'Solo, autogestión', desc: 'Soy mi propio Lead y Member.' },
  { id: 'squad', label: 'Con un equipo',     desc: 'Coordino o lidero a otras personas.' },
]

export default function OnboardingDiagnostic({ onComplete, onSkip }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    dominio: '',
    meta: '',
    porQue: '',
    medicion: '',
    tiempoSemana: '',
    frenos: [],
    modo: '',
    horizonteMeses: 3,
  })

  const update = (patch) => setData(d => ({ ...d, ...patch }))
  const next = () => setStep(s => Math.min(s + 1, STEPS.length))
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const canAdvance = useMemo(() => {
    switch (STEPS[step]?.id) {
      case 'dominio':  return !!data.dominio
      case 'meta':     return data.meta.trim().length >= 6
      case 'porQue':   return data.porQue.trim().length >= 6
      case 'medicion': return !!data.medicion
      case 'tiempo':   return !!data.tiempoSemana
      case 'freno':    return data.frenos.length > 0
      case 'modo':     return !!data.modo
      default:         return true
    }
  }, [step, data])

  const deployment = useMemo(() => {
    if (step < STEPS.length) return null
    return deployPlaybook(data)
  }, [step, data])

  const isPreview = step >= STEPS.length
  const current = STEPS[step]
  const Icon = current?.icon

  return (
    <div className="fixed inset-0 z-50 bg-nexus-bg overflow-y-auto">
      <div className="absolute inset-0 mesh-bg opacity-60 pointer-events-none" />
      <div className="relative max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-700/40 bg-blue-900/20 text-blue-300 text-xs font-mono tracking-widest uppercase mb-3">
            AXIS · Diagnóstico inicial
          </div>
          <h1 className="text-3xl font-bold text-nexus-text">Diseñemos tu Execution OS</h1>
          <p className="text-nexus-muted text-sm mt-2 max-w-md mx-auto">
            7 preguntas para que AXIS despliegue la metodología, los KRs y las primeras misiones
            ajustadas a <em>tu</em> dominio.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 text-xs font-mono text-nexus-muted">
            <span>Paso {Math.min(step + 1, STEPS.length)} de {STEPS.length}</span>
            <button onClick={onSkip} className="hover:text-nexus-text underline opacity-60 hover:opacity-100">
              Omitir diagnóstico
            </button>
          </div>
          <div className="w-full bg-nexus-surface rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 transition-all duration-500 rounded-full"
              style={{
                width: `${(Math.min(step, STEPS.length) / STEPS.length) * 100}%`,
                background: 'linear-gradient(90deg, #5B8DEF, #00D9FF)',
              }}
            />
          </div>
        </div>

        {/* Step card */}
        {!isPreview && (
          <div className="surface-elevated p-6 md:p-8 animate-fade-in" key={step}>
            <div className="flex items-center gap-3 mb-5">
              {Icon && (
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(91,141,239,0.12)', border: '1px solid rgba(91,141,239,0.25)' }}>
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
              )}
              <h2 className="text-xl font-semibold text-nexus-text">{current.titulo}</h2>
            </div>

            {/* ---- DOMINIO ---- */}
            {current.id === 'dominio' && (
              <div className="space-y-2">
                <p className="text-nexus-muted text-sm mb-3">
                  AXIS adapta su metodología según tu dominio. Elige el que mejor encaja:
                </p>
                {PLAYBOOK_OPTIONS.map(opt => (
                  <button key={opt.id}
                    onClick={() => update({ dominio: opt.id })}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      data.dominio === opt.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-nexus-border bg-nexus-bg/40 hover:border-blue-500/50'
                    }`}>
                    <div className="font-semibold text-nexus-text text-sm mb-0.5">{opt.label}</div>
                    <div className="text-nexus-muted text-xs">{opt.hint}</div>
                  </button>
                ))}
              </div>
            )}

            {/* ---- META ---- */}
            {current.id === 'meta' && (
              <div>
                <p className="text-nexus-muted text-sm mb-3">
                  Describe en una frase qué quieres lograr. Específico, no aspiracional.
                </p>
                <input type="text" value={data.meta} autoFocus
                  onChange={e => update({ meta: e.target.value })}
                  placeholder="Ej: Cerrar 10 clientes de pago antes de fin de Q3"
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg py-3 px-4 text-nexus-text placeholder-nexus-muted/50 focus:outline-none focus:border-blue-500 transition-colors" />
                <div className="mt-4">
                  <label className="text-nexus-muted text-xs font-mono uppercase tracking-widest mb-2 block">Horizonte</label>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 3, 6, 12].map(m => (
                      <button key={m} type="button"
                        onClick={() => update({ horizonteMeses: m })}
                        className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${
                          data.horizonteMeses === m
                            ? 'border-blue-500 bg-blue-900/30 text-blue-300'
                            : 'border-nexus-border text-nexus-muted hover:border-blue-500/50'
                        }`}>
                        {m} {m === 1 ? 'mes' : 'meses'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---- POR QUE ---- */}
            {current.id === 'porQue' && (
              <div>
                <p className="text-nexus-muted text-sm mb-3">
                  Tu motor emocional. Cuando te encuentres procrastinando, esto es lo que AXIS te recordará.
                </p>
                <textarea value={data.porQue} autoFocus
                  onChange={e => update({ porQue: e.target.value })}
                  placeholder="Porque...&#10;Ej: porque si no validamos en 90 días nos quedamos sin runway y este equipo se desarma."
                  rows={4}
                  className="w-full bg-nexus-bg border border-nexus-border rounded-lg py-3 px-4 text-nexus-text placeholder-nexus-muted/50 focus:outline-none focus:border-blue-500 transition-colors resize-none" />
              </div>
            )}

            {/* ---- MEDICION ---- */}
            {current.id === 'medicion' && (
              <div className="space-y-2">
                <p className="text-nexus-muted text-sm mb-3">
                  ¿Cómo sabrás que estás avanzando?
                </p>
                {[
                  { id: 'numerico',   label: 'Número claro', desc: 'Tengo una métrica concreta y un objetivo numérico.' },
                  { id: 'hito',       label: 'Hito binario', desc: 'O lo logro o no. Estados: en curso / logrado.' },
                  { id: 'cualitativo', label: 'Cualitativo / sensación', desc: 'Sabré que llegué cuando me sienta o vea diferente.' },
                ].map(opt => (
                  <button key={opt.id}
                    onClick={() => update({ medicion: opt.id })}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      data.medicion === opt.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-nexus-border bg-nexus-bg/40 hover:border-blue-500/50'
                    }`}>
                    <div className="font-semibold text-nexus-text text-sm mb-0.5">{opt.label}</div>
                    <div className="text-nexus-muted text-xs">{opt.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {/* ---- TIEMPO ---- */}
            {current.id === 'tiempo' && (
              <div>
                <p className="text-nexus-muted text-sm mb-3">
                  Sé honesto. AXIS calibra la ambición de los KRs con esto.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIEMPO_OPTS.map(t => (
                    <button key={t}
                      onClick={() => update({ tiempoSemana: t })}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        data.tiempoSemana === t
                          ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                          : 'border-nexus-border bg-nexus-bg/40 text-nexus-muted hover:border-blue-500/50 hover:text-nexus-text'
                      }`}>
                      <span className="font-mono text-sm font-bold">{t}</span>
                      <div className="text-[10px] mt-0.5 opacity-70">por semana</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---- FRENO ---- */}
            {current.id === 'freno' && (
              <div>
                <p className="text-nexus-muted text-sm mb-3">
                  Selecciona todos los que aplican. AXIS adapta los recordatorios y consejos a esto.
                </p>
                <div className="space-y-1.5">
                  {FRENO_OPTS.map(f => {
                    const checked = data.frenos.includes(f.id)
                    return (
                      <button key={f.id}
                        onClick={() => update({
                          frenos: checked
                            ? data.frenos.filter(x => x !== f.id)
                            : [...data.frenos, f.id]
                        })}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                          checked
                            ? 'border-blue-500 bg-blue-900/20'
                            : 'border-nexus-border bg-nexus-bg/40 hover:border-blue-500/50'
                        }`}>
                        <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                          checked ? 'bg-blue-500 border-blue-500' : 'border-nexus-border'
                        }`}>
                          {checked && <CheckCircle className="w-3 h-3 text-white" />}
                        </span>
                        <span className="text-sm text-nexus-text">{f.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ---- MODO ---- */}
            {current.id === 'modo' && (
              <div className="space-y-2">
                <p className="text-nexus-muted text-sm mb-3">Esto determina si AXIS se enfoca en autogestión o en gestión de equipo.</p>
                {MODO_OPTS.map(m => (
                  <button key={m.id}
                    onClick={() => update({ modo: m.id })}
                    className={`w-full text-left p-4 rounded-lg border transition-all flex items-start gap-3 ${
                      data.modo === m.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-nexus-border bg-nexus-bg/40 hover:border-blue-500/50'
                    }`}>
                    {m.id === 'solo' ? <UserIcon className="w-5 h-5 text-blue-400 mt-0.5" /> : <Users className="w-5 h-5 text-blue-400 mt-0.5" />}
                    <div>
                      <div className="font-semibold text-nexus-text text-sm">{m.label}</div>
                      <div className="text-nexus-muted text-xs">{m.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Nav */}
            <div className="flex items-center justify-between mt-7 pt-5 border-t border-nexus-border">
              <button onClick={prev} disabled={step === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-nexus-muted hover:text-nexus-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
              <button onClick={next} disabled={!canAdvance}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-md font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: canAdvance ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : '#1e3a5f' }}>
                {step === STEPS.length - 1 ? 'Ver mi sistema' : 'Continuar'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===== PREVIEW ===== */}
        {isPreview && deployment && (
          <div className="surface-elevated p-6 md:p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(34,211,168,0.12)', border: '1px solid rgba(34,211,168,0.35)' }}>
                <Sparkles className="w-5 h-5" style={{ color: '#22D3A8' }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-nexus-text">Tu Execution OS está listo</h2>
                <p className="text-nexus-muted text-xs font-mono mt-0.5">
                  Playbook: <span className="text-blue-300">{deployment.playbook.nombre}</span> ·
                  Ciclo {deployment.playbook.ciclo} · Vista {deployment.playbook.vistaHUD}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Metodología */}
              <div className="p-3 rounded-lg bg-nexus-bg/40 border border-nexus-border">
                <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-1">Metodología base</div>
                <div className="text-nexus-text text-sm">{deployment.meta.metodologia}</div>
              </div>

              {/* Objective */}
              <div>
                <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-2">Objetivo del periodo</div>
                <div className="p-3 rounded-lg bg-blue-900/15 border border-blue-700/40">
                  <div className="font-semibold text-nexus-text text-sm">{deployment.objective.titulo}</div>
                  {deployment.objective.descripcion && (
                    <div className="text-nexus-muted text-xs mt-1 italic">{deployment.objective.descripcion}</div>
                  )}
                  <div className="text-blue-300 text-[10px] font-mono mt-2">{deployment.objective.periodo}</div>
                </div>
              </div>

              {/* KRs */}
              <div>
                <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-2">
                  Key Results sugeridos ({deployment.krs.length})
                </div>
                <div className="space-y-1.5">
                  {deployment.krs.map((kr, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-nexus-bg/40 border border-nexus-border text-sm">
                      <span className="font-mono text-blue-400 text-xs">KR{i + 1}</span>
                      <span className="flex-1 text-nexus-text">{kr.titulo}</span>
                      <span className="text-nexus-muted text-xs font-mono">
                        {kr.current}/{kr.target}{kr.unit && ` ${kr.unit}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Misiones */}
              <div>
                <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-2">
                  Primeras misiones ({deployment.misiones.length})
                </div>
                <div className="space-y-1.5">
                  {deployment.misiones.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded bg-nexus-bg/40 border border-nexus-border">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex-shrink-0 mt-0.5 ${
                        m.prioridad === 'CRITICA' ? 'text-red-400 border-red-700' :
                        m.prioridad === 'ALTA' ? 'text-yellow-400 border-yellow-700' :
                        'text-blue-400 border-blue-700'
                      }`}>{m.prioridad}</span>
                      <div className="flex-1">
                        <div className="text-nexus-text text-sm font-medium">{m.titulo}</div>
                        <div className="text-nexus-muted text-xs mt-0.5">{m.descripcion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Consejos */}
              <div>
                <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-2">Principios operativos</div>
                <ul className="space-y-1.5">
                  {deployment.meta.consejosClave.map((c, i) => (
                    <li key={i} className="flex gap-2 text-sm text-nexus-text/90">
                      <span className="text-blue-400 font-mono flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 mt-7 pt-5 border-t border-nexus-border">
              <button onClick={() => setStep(STEPS.length - 1)}
                className="px-4 py-2.5 rounded-md text-sm text-nexus-muted hover:text-nexus-text border border-nexus-border hover:border-blue-500/50 transition-all">
                Ajustar respuestas
              </button>
              <button onClick={() => onComplete(deployment)}
                className="flex-1 px-5 py-2.5 rounded-md font-semibold text-sm text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}>
                Desplegar mi Execution OS
              </button>
            </div>
            <p className="text-nexus-muted text-[11px] text-center mt-3 opacity-60">
              Podrás editar el Objetivo, los KRs y las misiones en cualquier momento.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
