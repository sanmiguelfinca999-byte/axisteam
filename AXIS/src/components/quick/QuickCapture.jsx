import { useEffect, useRef, useState } from 'react'
import { useNEXUS } from '../../context/NEXUSContext'
import { X, Zap, ArrowRight, Flag } from 'lucide-react'
import { suggestDueDate } from '../../lib/smartDefaults'
import { parseQuickInput } from '../../lib/quickParser'
import { useFocusTrap } from '../../hooks/useFocusTrap'

/**
 * QuickCapture — inbox ultra-rápido para misiones.
 *
 * Pensado para TDAH (idea fugaz → captura en 5 segundos sin
 * abrir el composer completo). Atajo global: I.
 *
 * Prefijos opcionales en el input:
 *   !  -> CRITICA
 *   *  -> ALTA
 *   -  -> BAJA
 *   (sin prefijo) -> deriva por keywords, fallback NORMAL
 *
 * Enter guarda y cierra. ESC cancela. Cmd/Ctrl+Enter crea otra
 * misión limpiando el input para captura en cadena.
 */

const PRIORIDAD_COLOR = {
  CRITICA: '#FF5470', ALTA: '#FFB547', NORMAL: '#5B8DEF', BAJA: '#7A8AB8',
}

export default function QuickCapture({ open, onClose }) {
  const { crearMision, currentUser, axisMode, sprintActivo, ACTIVOS_CREDENTIALS } = useNEXUS()
  const [text, setText] = useState('')
  const [savedFlash, setSavedFlash] = useState(null)
  const inputRef = useRef(null)
  const trapRef = useFocusTrap(open)

  // Reset al abrir + focus
  useEffect(() => {
    if (!open) return
    setText('')
    setSavedFlash(null)
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  // ESC cierra
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const parsed = parseQuickInput(text)
  const accent = PRIORIDAD_COLOR[parsed.prioridad] || PRIORIDAD_COLOR.NORMAL
  const canSave = parsed.titulo.length >= 2

  const doSave = async (chain = false) => {
    if (!canSave) return
    // Determinar owner: Solo Mode = el usuario; Squad Mode = el currentUser o el primer Activo
    const owner = axisMode === 'solo'
      ? currentUser?.id
      : (currentUser?.id || ACTIVOS_CREDENTIALS[0]?.id)
    await crearMision({
      activoId: owner,
      titulo: parsed.titulo,
      descripcion: 'Captura rápida desde QuickCapture.',
      prioridad: parsed.prioridad,
      fechaLimite: suggestDueDate(parsed.prioridad),
      sprintId: sprintActivo?.id ?? null,
      keyResultId: null,
    })
    if (chain) {
      setSavedFlash({ titulo: parsed.titulo, prioridad: parsed.prioridad })
      setText('')
      setTimeout(() => setSavedFlash(null), 1200)
      setTimeout(() => inputRef.current?.focus(), 30)
    } else {
      onClose()
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      doSave(e.metaKey || e.ctrlKey)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[18vh] bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qc-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div ref={trapRef} className="surface-floating w-full max-w-xl rounded-xl overflow-hidden" style={{ boxShadow: '0 12px 48px rgba(91,141,239,0.25)' }}>
        <header className="flex items-center justify-between px-4 py-2.5 border-b border-nexus-border" style={{ background: 'rgba(13,20,56,0.95)' }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-300" />
            <span id="qc-title" className="text-nexus-text text-xs font-mono uppercase tracking-widest">Captura rápida</span>
          </div>
          <button onClick={onClose} aria-label="Cerrar captura rápida" className="text-nexus-muted hover:text-nexus-text p-1 rounded hover:bg-nexus-bg/60 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </header>

        <div className="p-4">
          <div className="flex items-stretch gap-2">
            <span
              className="flex items-center px-2 rounded-l border-y border-l border-nexus-border bg-nexus-bg/70"
              style={{ borderColor: parsed.titulo ? `${accent}88` : undefined }}
              title={`Prioridad: ${parsed.prioridad}`}
            >
              <Flag className="w-3.5 h-3.5" style={{ color: accent }} />
            </span>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={120}
              placeholder="Captura una misión en 5 segundos..."
              className="flex-1 bg-nexus-bg border border-nexus-border rounded-r px-3 py-2.5 text-nexus-text text-base placeholder-nexus-muted/60 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderLeft: 'none' }}
              aria-label="Texto de la misión"
            />
          </div>

          <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-nexus-muted">
            <span><kbd className="bg-nexus-bg/60 border border-nexus-border px-1 py-0.5 rounded text-nexus-text">!</kbd> crítica</span>
            <span><kbd className="bg-nexus-bg/60 border border-nexus-border px-1 py-0.5 rounded text-nexus-text">*</kbd> alta</span>
            <span><kbd className="bg-nexus-bg/60 border border-nexus-border px-1 py-0.5 rounded text-nexus-text">-</kbd> baja</span>
            <span className="ml-auto">
              <kbd className="bg-nexus-bg/60 border border-nexus-border px-1 py-0.5 rounded text-nexus-text">Enter</kbd> guarda ·
              <kbd className="ml-1 bg-nexus-bg/60 border border-nexus-border px-1 py-0.5 rounded text-nexus-text">⌘/Ctrl+Enter</kbd> guarda y captura otra
            </span>
          </div>

          {parsed.titulo && (
            <div className="mt-3 p-2 rounded-lg border" style={{ borderColor: `${accent}55`, background: `${accent}10` }}>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-nexus-muted">Se creará como</span>
                <span className="font-mono font-bold" style={{ color: accent }}>{parsed.prioridad}</span>
                <span className="text-nexus-muted">· vence en</span>
                <span className="font-mono text-nexus-text">
                  {new Date(suggestDueDate(parsed.prioridad)).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}
                </span>
              </div>
            </div>
          )}

          {savedFlash && (
            <div className="mt-3 p-2 rounded-lg border border-nexus-green/40 bg-nexus-green/10 text-nexus-green text-xs flex items-center gap-2" role="status" aria-live="polite">
              <Zap className="w-3.5 h-3.5" />
              <span>Capturada: <strong>{savedFlash.titulo}</strong></span>
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-mono text-nexus-muted hover:text-nexus-text border border-nexus-border rounded hover:border-blue-500/50 transition-all">
              Cancelar
            </button>
            <button
              onClick={() => doSave(false)}
              disabled={!canSave}
              className="px-4 py-1.5 rounded text-xs font-mono font-semibold text-white flex items-center gap-1.5 transition-all disabled:opacity-40"
              style={{ background: canSave ? 'linear-gradient(135deg, #1d4ed8, #2563eb)' : 'rgba(91,141,239,0.20)' }}
            >
              Capturar <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
