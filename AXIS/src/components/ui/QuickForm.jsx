import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const inputCls = "w-full bg-nexus-bg border border-nexus-border rounded-md px-3 py-2 text-nexus-text text-sm focus:outline-none focus:border-blue-500 transition-colors"
const labelCls = "block text-nexus-muted text-xs font-mono uppercase tracking-widest mb-1.5"

/**
 * QuickForm — modal pequeño reutilizable para crear entidades simples.
 *
 * Props:
 *  - open, onClose
 *  - title: string
 *  - fields: Array<{ name, label, type, placeholder?, options?, required?, defaultValue? }>
 *  - submitLabel
 *  - onSubmit: (values) => void
 */
export default function QuickForm({ open, onClose, title, fields, submitLabel = 'Crear', onSubmit }) {
  const initial = fields.reduce((acc, f) => ({ ...acc, [f.name]: f.defaultValue ?? '' }), {})
  const [values, setValues] = useState(initial)

  useEffect(() => {
    if (open) setValues(fields.reduce((acc, f) => ({ ...acc, [f.name]: f.defaultValue ?? '' }), {}))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(values)
    onClose()
  }

  const canSubmit = fields.every(f => !f.required || (values[f.name] !== '' && values[f.name] != null))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit}
        className="relative w-full max-w-md surface-floating p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-nexus-text font-semibold tracking-wide">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-nexus-muted hover:text-nexus-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map(f => (
            <div key={f.name}>
              <label htmlFor={`qf-${f.name}`} className={labelCls}>{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea id={`qf-${f.name}`} rows={2}
                  value={values[f.name]} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                  placeholder={f.placeholder} required={f.required}
                  className={inputCls} maxLength={300} />
              ) : f.type === 'select' ? (
                <select id={`qf-${f.name}`} value={values[f.name]}
                  onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                  required={f.required} className={inputCls}>
                  {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input id={`qf-${f.name}`} type={f.type || 'text'}
                  value={values[f.name]}
                  onChange={e => setValues(v => ({ ...v, [f.name]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  placeholder={f.placeholder} required={f.required}
                  className={inputCls} maxLength={f.maxLength || 200}
                  min={f.min} max={f.max} step={f.step} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="hud-btn-ghost text-xs">Cancelar</button>
          <button type="submit" disabled={!canSubmit}
            className="hud-btn-primary text-xs disabled:opacity-40 disabled:cursor-not-allowed">{submitLabel}</button>
        </div>
      </form>
    </div>
  )
}
