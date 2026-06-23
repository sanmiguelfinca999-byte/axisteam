import { useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

/**
 * KeyboardShortcuts — Panel descubrible con todos los atajos.
 *
 * Atajo global: ? (shift + /). ESC cierra. Diseñado como referencia
 * rápida sin interrumpir el flujo. Aumenta descubribilidad de las
 * micro-features que de otra forma quedan ocultas.
 */

const SECTIONS = [
  {
    title: 'Globales',
    items: [
      { key: '⌘/Ctrl + K', desc: 'Abrir Command Palette' },
      { key: '?',           desc: 'Mostrar este panel' },
      { key: 'Esc',         desc: 'Cerrar modal o panel abierto' },
    ],
  },
  {
    title: 'Foco',
    items: [
      { key: 'F',           desc: 'Abrir Now Mode (foco profundo)' },
      { key: 'I',           desc: 'Quick Capture (captura rápida)' },
    ],
  },
  {
    title: 'Misiones',
    items: [
      { key: 'N',                  desc: 'Nueva misión (composer completo) — solo Director' },
      { key: '⌘/Ctrl + Enter',     desc: 'En Quick Capture: guardar y abrir otra' },
      { key: 'Enter',              desc: 'En Quick Capture: guardar y cerrar' },
      { key: '! / * / -',          desc: 'Prefijos de prioridad en Quick Capture: crítica / alta / baja' },
    ],
  },
  {
    title: 'Navegación HUD',
    items: [
      { key: 'Tab / Shift+Tab',    desc: 'Mover foco entre elementos accesibles' },
      { key: '←  →  (en slider)',   desc: 'Ajustar progreso ±5%' },
      { key: 'Enter / Espacio',    desc: 'Activar elemento enfocado' },
    ],
  },
]

export default function KeyboardShortcuts({ open, onClose }) {
  const trapRef = useFocusTrap(open)
  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ks-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div ref={trapRef} className="surface-floating w-full max-w-lg rounded-xl overflow-hidden">
        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-nexus-border" style={{ background: 'rgba(13,20,56,0.95)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(91,141,239,0.16)', border: '1px solid rgba(91,141,239,0.35)' }}>
              <Keyboard className="w-4 h-4 text-blue-300" />
            </div>
            <h2 id="ks-title" className="text-nexus-text font-bold text-sm">Atajos de teclado</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar panel de atajos" className="text-nexus-muted hover:text-nexus-text p-1 rounded hover:bg-nexus-bg/60 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {SECTIONS.map(sec => (
            <section key={sec.title} className="mb-4 last:mb-0">
              <h3 className="text-nexus-muted text-[10px] font-mono uppercase tracking-widest mb-2">{sec.title}</h3>
              <ul className="space-y-1">
                {sec.items.map(item => (
                  <li key={item.key + item.desc} className="flex items-center justify-between gap-3 py-1.5 border-b border-nexus-border/40 last:border-0">
                    <span className="text-nexus-text text-xs">{item.desc}</span>
                    <kbd className="text-[10px] font-mono bg-nexus-bg/60 border border-nexus-border px-2 py-0.5 rounded text-nexus-text whitespace-nowrap">
                      {item.key}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          <p className="text-nexus-muted text-[11px] italic mt-2">
            Los atajos se desactivan automáticamente cuando estás escribiendo en un input o textarea.
          </p>
        </div>
      </div>
    </div>
  )
}
