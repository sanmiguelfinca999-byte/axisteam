import { useState, useEffect } from 'react'
import { X, Send, Mail, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const AVATARS = ['🕵️', '⚡', '📡', '🔍', '💻', '📦', '🛡️', '🎯', '📊', '🗺️', '🌙', '🔭', '⚓', '🦅', '🐺']

const inputCls = "w-full bg-nexus-bg border border-nexus-border rounded-md px-3 py-2 text-nexus-text text-sm focus:outline-none focus:border-blue-500 transition-colors"
const labelCls = "block text-nexus-muted text-xs font-mono uppercase tracking-widest mb-1.5"

/**
 * InviteOperatorModal — invoca Edge Function invite-operator.
 * Validación adicional client-side antes de gastar invocación.
 */
export default function InviteOperatorModal({ open, onClose, onInvited }) {
  const [form, setForm] = useState({
    email: '',
    codename: '',
    nombre: '',
    especialidad: '',
    avatar: AVATARS[0],
    role: 'OPERATOR',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!open) return
    setForm({ email: '', codename: '', nombre: '', especialidad: '', avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)], role: 'OPERATOR' })
    setError(''); setSuccess('')
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setSuccess('')
    setLoading(true)

    try {
      if (!supabase) throw new Error('Backend no configurado')

      const { data, error: invokeErr } = await supabase.functions.invoke('invite-operator', {
        body: {
          email:        form.email.trim(),
          codename:     form.codename.trim().toUpperCase(),
          nombre:       form.nombre.trim(),
          especialidad: form.especialidad.trim() || null,
          avatar:       form.avatar,
          role:         form.role,
        },
      })

      if (invokeErr) throw new Error(invokeErr.message || 'Falló la invitación')
      if (data?.error) throw new Error(data.error)

      setSuccess(`Invitación enviada a ${form.email}. Recibirá un correo para definir su clave.`)
      if (onInvited) onInvited(data?.user)
      setTimeout(() => onClose(), 2000)
    } catch (err) {
      setError(err?.message || 'Error al invitar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="invite-title">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <form onSubmit={handleSubmit} className="relative w-full max-w-md surface-floating p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" />
            <h2 id="invite-title" className="text-nexus-text font-semibold tracking-wide">Invitar nuevo Operator</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-nexus-muted hover:text-nexus-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="inv-email" className={labelCls}>Email</label>
            <input id="inv-email" type="email" required
              value={form.email} onChange={e => update('email', e.target.value)}
              placeholder="operator@empresa.com"
              className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-codename" className={labelCls}>Codename</label>
              <input id="inv-codename" type="text" required
                value={form.codename}
                onChange={e => update('codename', e.target.value.toUpperCase())}
                placeholder="PHOENIX" maxLength={20}
                className={inputCls + ' uppercase'} />
            </div>
            <div>
              <label htmlFor="inv-nombre" className={labelCls}>Nombre</label>
              <input id="inv-nombre" type="text" required
                value={form.nombre} onChange={e => update('nombre', e.target.value)}
                placeholder="María López"
                className={inputCls} />
            </div>
          </div>

          <div>
            <label htmlFor="inv-esp" className={labelCls}>Especialidad</label>
            <input id="inv-esp" type="text"
              value={form.especialidad} onChange={e => update('especialidad', e.target.value)}
              placeholder="Análisis financiero · Comunicaciones · ..."
              className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Avatar</label>
            <div className="flex flex-wrap gap-1.5">
              {AVATARS.map(a => (
                <button key={a} type="button" onClick={() => update('avatar', a)}
                  aria-pressed={form.avatar === a}
                  aria-label={`Seleccionar avatar ${a}`}
                  className={`w-9 h-9 rounded text-xl border transition-all ${
                    form.avatar === a ? 'border-blue-500 bg-blue-900/30' : 'border-nexus-border hover:border-blue-500/50'
                  }`}>{a}</button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="inv-role" className={labelCls}>Rol</label>
            <select id="inv-role" value={form.role} onChange={e => update('role', e.target.value)} className={inputCls}>
              <option value="OPERATOR">Operator (acceso a sus misiones)</option>
              <option value="DIRECTOR">Director (acceso completo) — usar con cuidado</option>
            </select>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-md px-3 py-2" role="alert">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-mono break-words">{error}</span>
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 text-nexus-green text-sm bg-emerald-900/20 border border-emerald-800/50 rounded-md px-3 py-2" role="status">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-mono break-words">{success}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-nexus-muted bg-nexus-bg/40 border border-nexus-border/40 rounded p-2">
            <Sparkles className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span>El nuevo Operator recibirá un correo. Define su propia clave en el primer login.</span>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={loading} className="hud-btn-ghost text-xs">Cancelar</button>
          <button type="submit" disabled={loading || !form.email || !form.codename || !form.nombre}
            className="hud-btn-primary text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? (
              <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Enviando...</>
            ) : (
              <><Send className="w-3.5 h-3.5" />Enviar invitación</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
