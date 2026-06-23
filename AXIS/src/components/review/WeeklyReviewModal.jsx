import { useEffect, useMemo, useState, useRef } from 'react'
import { ClipboardCheck, X, TrendingUp, Flame, AlertTriangle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'
import { useFocusTrap } from '../../hooks/useFocusTrap'

/**
 * WeeklyReviewModal — Ola 4
 *
 * Modal estructurado de revisión semanal del Execution OS.
 * Secciones:
 *   1. Recap — misiones completadas última semana, KRs movidos, streak
 *   2. Stuck — misiones activas sin movimiento ≥5 días
 *   3. Planning — 3 inputs para las misiones de la siguiente semana
 *   4. Cierre — persiste registro en axis_review_log
 *
 * Trigger: el padre decide cuándo abrirlo (auto + manual).
 * Cuando se confirma, se llama `registerWeeklyReview` y se cierra.
 */

const MS_DAY = 86_400_000
const STUCK_THRESHOLD_DAYS = 5

const dateLabel = (iso) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })

const daysSinceLastEvent = (tarea) => {
  const eventos = (tarea.eventos || []).slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  const ref = eventos[0]?.timestamp || tarea.fechaCreacion
  if (!ref) return 999
  return Math.floor((Date.now() - new Date(ref).getTime()) / MS_DAY)
}

export default function WeeklyReviewModal({ open, onClose }) {
  const {
    tasks,
    currentUser,
    axisMode,
    userPlaybook,
    keyResults,
    streakActual,
    registerWeeklyReview,
    crearMision,
  } = useNEXUS()

  const [planning, setPlanning] = useState(['', '', ''])
  const [notes, setNotes] = useState('')
  const dialogRef = useRef(null)
  const trapRef = useFocusTrap(open)

  // Reset estado al abrir
  useEffect(() => {
    if (open) {
      setPlanning(['', '', ''])
      setNotes('')
      // Focus trap básico
      setTimeout(() => dialogRef.current?.focus(), 50)
    }
  }, [open])

  // ESC cierra
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const scoped = useMemo(() => {
    if (!currentUser) return []
    if (axisMode === 'solo') return tasks.filter(t => t.activoId === currentUser.id)
    return tasks
  }, [tasks, currentUser, axisMode])

  // Recap — últimos 7 días
  const weekAgo = Date.now() - 7 * MS_DAY

  const completadasSemana = useMemo(() => {
    return scoped.filter(t => {
      if (t.estado !== 'COMPLETADA') return false
      const ev = (t.eventos || []).find(e => e.tipo === 'COMPLETED' || e.tipo === 'COMPLETADA')
      const ts = ev?.timestamp ? new Date(ev.timestamp).getTime() : new Date(t.fechaLimite).getTime()
      return ts >= weekAgo
    })
  }, [scoped, weekAgo])

  const stuckMissions = useMemo(() => {
    return scoped
      .filter(t => t.estado !== 'COMPLETADA' && daysSinceLastEvent(t) >= STUCK_THRESHOLD_DAYS)
      .sort((a, b) => daysSinceLastEvent(b) - daysSinceLastEvent(a))
      .slice(0, 6)
  }, [scoped])

  const krProgreso = useMemo(() => {
    return (keyResults || []).slice(0, 5).map(k => ({
      id: k.id,
      titulo: k.titulo,
      pct: typeof k.target === 'number' && k.target > 0 ? Math.round((k.current / k.target) * 100) : 0,
    }))
  }, [keyResults])

  const handleConfirm = () => {
    const cleanPlanning = planning.map(p => p.trim()).filter(Boolean)

    // Crear las misiones de planning como tareas reales
    if (currentUser) {
      for (const titulo of cleanPlanning) {
        crearMision({
          activoId: currentUser.id,
          titulo,
          descripcion: 'Misión definida en Weekly Review.',
          prioridad: 'NORMAL',
          fechaLimite: new Date(Date.now() + 7 * MS_DAY).toISOString(),
        })
      }
    }

    registerWeeklyReview({
      recap: {
        completadas: completadasSemana.length,
        stuck: stuckMissions.length,
        streakActual,
      },
      planning: cleanPlanning,
      notes: notes.trim(),
    })
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weekly-review-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={(node) => { dialogRef.current = node; if (trapRef) trapRef.current = node }}
        tabIndex={-1}
        className="surface-floating w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-blue-700/40 focus:outline-none"
        style={{ boxShadow: '0 0 40px rgba(91,141,239,0.20)' }}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3 border-b border-nexus-border" style={{ background: 'rgba(13,20,56,0.95)', backdropFilter: 'blur(8px)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,141,239,0.16)', border: '1px solid rgba(91,141,239,0.35)' }}>
              <ClipboardCheck className="w-4 h-4 text-blue-300" />
            </div>
            <div className="min-w-0">
              <h2 id="weekly-review-title" className="text-nexus-text font-bold text-sm">Weekly Review</h2>
              <p className="text-nexus-muted text-[10px] font-mono truncate">
                {userPlaybook?.nombre ? `${userPlaybook.nombre} · ` : ''}{userPlaybook?.ritualSemanal?.dia || 'semana'} · {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long' })}
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar weekly review" className="text-nexus-muted hover:text-nexus-text p-1 rounded hover:bg-nexus-bg/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-5 space-y-5">
          {/* ============ RECAP ============ */}
          <section>
            <h3 className="flex items-center gap-2 text-nexus-text text-sm font-semibold mb-3">
              <Sparkles className="w-4 h-4 text-blue-400" /> Recap de la semana
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <StatBlock icon={CheckCircle2} label="Completadas" value={completadasSemana.length} accent="#22D3A8" />
              <StatBlock icon={Flame} label="Racha actual" value={`${streakActual}${streakActual >= 7 ? ' 🔥' : ''}`} accent={streakActual >= 7 ? '#FFB547' : '#5B8DEF'} />
              <StatBlock icon={AlertTriangle} label="Atascadas" value={stuckMissions.length} accent={stuckMissions.length > 0 ? '#FFB547' : '#7A8AB8'} />
            </div>
            {krProgreso.length > 0 && (
              <div className="surface-card p-3">
                <div className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Key Results
                </div>
                <ul className="space-y-1.5">
                  {krProgreso.map(kr => (
                    <li key={kr.id} className="flex items-center gap-3 text-xs">
                      <span className="text-nexus-text flex-1 truncate">{kr.titulo}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-nexus-bg rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, kr.pct)}%` }} />
                        </div>
                        <span className="text-nexus-text font-mono font-semibold w-10 text-right">{kr.pct}%</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* ============ STUCK ============ */}
          {stuckMissions.length > 0 && (
            <section>
              <h3 className="flex items-center gap-2 text-nexus-text text-sm font-semibold mb-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400" /> Sin movimiento ≥ {STUCK_THRESHOLD_DAYS} días
              </h3>
              <ul className="space-y-1.5">
                {stuckMissions.map(t => {
                  const dias = daysSinceLastEvent(t)
                  return (
                    <li key={t.id} className="surface-card p-2.5 flex items-start gap-3">
                      <div className="w-1 self-stretch rounded-full bg-yellow-500/60 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-nexus-text text-xs font-medium truncate">{t.titulo}</p>
                        <p className="text-nexus-muted text-[10px] font-mono">{dias} días sin tocar · {t.progreso}% · vence {dateLabel(t.fechaLimite)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {/* ============ PLANNING ============ */}
          <section>
            <h3 className="flex items-center gap-2 text-nexus-text text-sm font-semibold mb-2">
              <ArrowRight className="w-4 h-4 text-blue-400" /> Tus 3 misiones para la próxima semana
            </h3>
            <p className="text-nexus-muted text-xs mb-3">
              Escribe cada misión como una acción concreta. Se crearán con prioridad <em>Normal</em> y vencimiento en 7 días — puedes editar después.
            </p>
            <div className="space-y-2">
              {planning.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-mono text-blue-400 text-xs w-6">M{i + 1}</span>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => setPlanning(p => p.map((x, idx) => idx === i ? e.target.value : x))}
                    placeholder={i === 0 ? 'La misión principal: la que mueve el KR más importante' : i === 1 ? 'Una palanca de apoyo' : 'El frente que NO puedes desatender'}
                    className="flex-1 bg-nexus-bg border border-nexus-border rounded py-2 px-3 text-nexus-text text-sm placeholder-nexus-muted/50 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ============ NOTES ============ */}
          <section>
            <h3 className="text-nexus-text text-sm font-semibold mb-2">Notas (opcional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Qué funcionó. Qué falló. Qué cambiarías la próxima semana."
              className="w-full bg-nexus-bg border border-nexus-border rounded py-2 px-3 text-nexus-text text-sm placeholder-nexus-muted/50 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </section>
        </div>

        <footer className="sticky bottom-0 flex items-center justify-end gap-2 px-5 py-3 border-t border-nexus-border" style={{ background: 'rgba(13,20,56,0.95)', backdropFilter: 'blur(8px)' }}>
          <button onClick={onClose} className="px-3 py-2 text-xs text-nexus-muted hover:text-nexus-text border border-nexus-border rounded hover:border-blue-500/50 transition-all">
            Posponer
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded text-xs font-semibold text-white transition-all flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', boxShadow: '0 0 16px rgba(59,130,246,0.20)' }}
          >
            Registrar review <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </footer>
      </div>
    </div>
  )
}

function StatBlock({ icon: Icon, label, value, accent }) {
  return (
    <div className="surface-card p-3 text-center">
      <div className="flex items-center justify-center gap-1 text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-1">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-xl font-bold font-mono" style={{ color: accent }}>{value}</div>
    </div>
  )
}
