import { useState, useEffect, useMemo } from 'react'
import { X, Save, Trash2, Target, User, Calendar, Flag, Hash, Link2, AlertTriangle, Sparkles } from 'lucide-react'
import { useNEXUS } from '../../context/NEXUSContext'
import { MISSION_TEMPLATES } from '../../data/missionTemplates'
import SmartSuggestionsRow from './SmartSuggestionsRow'

const FIBONACCI = [1, 2, 3, 5, 8, 13, 21]
const PRIORIDADES = ['CRITICA', 'ALTA', 'NORMAL', 'BAJA']

const PRI_STYLES = {
  CRITICA: 'border-red-600 text-red-300 bg-red-900/30',
  ALTA:    'border-yellow-600 text-yellow-300 bg-yellow-900/20',
  NORMAL:  'border-blue-700 text-blue-300 bg-blue-900/20',
  BAJA:    'border-nexus-border text-nexus-muted bg-nexus-bg',
}

const inputCls = "w-full bg-nexus-bg border border-nexus-border rounded-md px-3 py-2 text-nexus-text text-sm focus:outline-none focus:border-blue-500 transition-colors"
const labelCls = "block text-nexus-muted text-xs font-mono uppercase tracking-widest mb-1.5"

/**
 * MissionComposer — drawer lateral para crear/editar una misión.
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - mission?: Mission (modo edición si se pasa)
 *  - defaults?: { activoId?, sprintId?, keyResultId? }  preset al crear
 */
export default function MissionComposer({ open, onClose, mission, defaults = {} }) {
  const { ACTIVOS_CREDENTIALS, sprints, keyResults, tasks, crearMision, actualizarMision, eliminarMision, currentUser, sprintActivo } = useNEXUS()
  const isEdit = !!mission

  const tomorrow = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().slice(0, 10)
  }, [])

  const [form, setForm] = useState(() => ({
    titulo:       mission?.titulo ?? '',
    descripcion:  mission?.descripcion ?? '',
    activoId:     mission?.activoId ?? defaults.activoId ?? ACTIVOS_CREDENTIALS[0]?.id ?? '',
    prioridad:    mission?.prioridad ?? 'NORMAL',
    fechaLimite:  mission?.fechaLimite ? mission.fechaLimite.slice(0, 10) : tomorrow,
    sprintId:     mission?.sprintId ?? defaults.sprintId ?? sprintActivo?.id ?? '',
    keyResultId:  mission?.keyResultId ?? defaults.keyResultId ?? '',
    storyPoints:  mission?.storyPoints ?? 3,
    bloqueadaPor: mission?.bloqueadaPor ?? [],
  }))

  // Reset al cambiar misión editada
  useEffect(() => {
    if (!open) return
    setForm({
      titulo:       mission?.titulo ?? '',
      descripcion:  mission?.descripcion ?? '',
      activoId:     mission?.activoId ?? defaults.activoId ?? ACTIVOS_CREDENTIALS[0]?.id ?? '',
      prioridad:    mission?.prioridad ?? 'NORMAL',
      fechaLimite:  mission?.fechaLimite ? mission.fechaLimite.slice(0, 10) : tomorrow,
      sprintId:     mission?.sprintId ?? defaults.sprintId ?? sprintActivo?.id ?? '',
      keyResultId:  mission?.keyResultId ?? defaults.keyResultId ?? '',
      storyPoints:  mission?.storyPoints ?? 3,
      bloqueadaPor: mission?.bloqueadaPor ?? [],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mission?.id])

  // ESC cierra
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const applyTemplate = (tpl) => {
    const fechaTpl = new Date()
    fechaTpl.setDate(fechaTpl.getDate() + (tpl.defaults.diasDuracion || 7))
    setForm(prev => ({
      ...prev,
      titulo:      tpl.defaults.titulo,
      descripcion: tpl.defaults.descripcion,
      prioridad:   tpl.defaults.prioridad || prev.prioridad,
      storyPoints: tpl.defaults.storyPoints || prev.storyPoints,
      fechaLimite: fechaTpl.toISOString().slice(0, 10),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      fechaLimite: new Date(form.fechaLimite + 'T23:59:59').toISOString(),
      keyResultId: form.keyResultId || null,
      sprintId: form.sprintId || null,
    }
    if (isEdit) actualizarMision(mission.id, payload)
    else        crearMision(payload)
    onClose()
  }

  const handleDelete = () => {
    if (!isEdit) return
    if (!window.confirm(`¿Eliminar "${mission.titulo}"? No se puede deshacer.`)) return
    eliminarMision(mission.id)
    onClose()
  }

  const otrasMisiones = tasks.filter(t => t.id !== mission?.id && t.estado !== 'COMPLETADA')

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="mc-title">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute top-0 right-0 h-full w-full max-w-lg surface-floating rounded-none border-l border-blue-700/30 flex flex-col animate-slide-in">
        <div className="px-5 py-4 border-b border-nexus-border/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            <h2 id="mc-title" className="text-nexus-text font-semibold tracking-wide">
              {isEdit ? 'Editar misión' : 'Nueva misión'}
            </h2>
            {isEdit && <span className="text-nexus-muted text-xs font-mono">· {mission.id}</span>}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="text-nexus-muted hover:text-nexus-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {!isEdit && (
            <div>
              <label className={labelCls}><Sparkles className="w-3 h-3 inline mr-1" />Plantilla (opcional)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MISSION_TEMPLATES.map(tpl => (
                  <button key={tpl.id} type="button" onClick={() => applyTemplate(tpl)}
                    title={tpl.descripcionCorta}
                    className="flex flex-col items-start gap-0.5 p-2 rounded border border-nexus-border bg-nexus-bg/30 hover:border-purple-500 hover:bg-purple-900/10 transition-all text-left">
                    <span className="text-base" aria-hidden="true">{tpl.icon}</span>
                    <span className="text-nexus-text text-xs font-medium leading-tight">{tpl.nombre}</span>
                    <span className="text-nexus-muted text-[10px] line-clamp-1">{tpl.descripcionCorta}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label htmlFor="mc-titulo" className={labelCls}>Título</label>
            <input id="mc-titulo" type="text" required autoFocus
              value={form.titulo} onChange={e => update('titulo', e.target.value)}
              placeholder="Describe la misión en una frase..."
              className={inputCls} maxLength={120} />
          </div>

          {/* Sugerencias inteligentes — chips para aplicar (no impone defaults) */}
          {!isEdit && (
            <SmartSuggestionsRow
              form={form}
              onApply={(key, value) => update(key, value)}
            />
          )}

          <div>
            <label htmlFor="mc-desc" className={labelCls}>Descripción</label>
            <textarea id="mc-desc" rows={3}
              value={form.descripcion} onChange={e => update('descripcion', e.target.value)}
              placeholder="Contexto, expectativas, criterios de éxito..."
              className={inputCls} maxLength={500} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mc-operator" className={labelCls}>
                <User className="w-3 h-3 inline mr-1" />Operator
              </label>
              <select id="mc-operator" value={form.activoId} onChange={e => update('activoId', e.target.value)} className={inputCls}>
                {ACTIVOS_CREDENTIALS.map(a => (
                  <option key={a.id} value={a.id}>{a.codename} · {a.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mc-fecha" className={labelCls}>
                <Calendar className="w-3 h-3 inline mr-1" />Fecha límite
              </label>
              <input id="mc-fecha" type="date" required
                value={form.fechaLimite} onChange={e => update('fechaLimite', e.target.value)}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}><Flag className="w-3 h-3 inline mr-1" />Prioridad</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORIDADES.map(p => (
                <button key={p} type="button" onClick={() => update('prioridad', p)}
                  aria-pressed={form.prioridad === p}
                  className={`px-2 py-1.5 rounded text-xs font-mono font-bold border transition-all ${
                    form.prioridad === p ? `${PRI_STYLES[p]} ring-2 ring-offset-1 ring-offset-nexus-bg ring-blue-400` : PRI_STYLES[p] + ' opacity-50 hover:opacity-100'
                  }`}>{p}</button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelCls}><Hash className="w-3 h-3 inline mr-1" />Story points</label>
            <div className="grid grid-cols-7 gap-1.5">
              {FIBONACCI.map(n => (
                <button key={n} type="button" onClick={() => update('storyPoints', n)}
                  aria-pressed={form.storyPoints === n}
                  className={`py-1.5 rounded text-xs font-mono font-bold border transition-all ${
                    form.storyPoints === n
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                      : 'border-nexus-border text-nexus-muted hover:border-blue-500 hover:text-nexus-text'
                  }`}>{n}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mc-sprint" className={labelCls}>
                <Target className="w-3 h-3 inline mr-1" />Sprint
              </label>
              <select id="mc-sprint" value={form.sprintId || ''} onChange={e => update('sprintId', e.target.value)} className={inputCls}>
                <option value="">Sin sprint</option>
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre} · {s.estado}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mc-kr" className={labelCls}>
                <Link2 className="w-3 h-3 inline mr-1" />Key Result
              </label>
              <select id="mc-kr" value={form.keyResultId || ''} onChange={e => update('keyResultId', e.target.value)} className={inputCls}>
                <option value="">Sin KR vinculado</option>
                {keyResults.map(kr => (
                  <option key={kr.id} value={kr.id}>{kr.titulo}</option>
                ))}
              </select>
            </div>
          </div>

          {otrasMisiones.length > 0 && (
            <div>
              <label className={labelCls}>Bloqueada por (opcional)</label>
              <div className="max-h-32 overflow-y-auto border border-nexus-border rounded-md p-2 space-y-1 bg-nexus-bg/50">
                {otrasMisiones.map(t => {
                  const checked = form.bloqueadaPor.includes(t.id)
                  return (
                    <label key={t.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-nexus-bg/60 rounded px-1 py-0.5">
                      <input type="checkbox" checked={checked}
                        onChange={e => update('bloqueadaPor', e.target.checked
                          ? [...form.bloqueadaPor, t.id]
                          : form.bloqueadaPor.filter(x => x !== t.id))}
                        className="accent-blue-500" />
                      <span className="text-nexus-text truncate">{t.titulo}</span>
                      <span className="text-nexus-muted font-mono ml-auto">{t.id}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {isEdit && form.prioridad === 'CRITICA' && (
            <div className="flex items-start gap-2 p-2 rounded bg-yellow-900/20 border border-yellow-700/50 text-xs text-yellow-200">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Cambiar a CRITICA activará PulseAI si la salud del Operator baja del 40%.</span>
            </div>
          )}
        </form>

        <div className="px-5 py-4 border-t border-nexus-border/40 flex items-center justify-between flex-shrink-0">
          {isEdit ? (
            <button type="button" onClick={handleDelete}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs font-mono transition-colors">
              <Trash2 className="w-3.5 h-3.5" />Eliminar
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} className="hud-btn-ghost text-xs">Cancelar</button>
            <button type="submit" onClick={handleSubmit}
              disabled={!form.titulo.trim() || !form.activoId}
              className="hud-btn-primary text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
              <Save className="w-3.5 h-3.5" />
              {isEdit ? 'Guardar cambios' : 'Crear misión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
