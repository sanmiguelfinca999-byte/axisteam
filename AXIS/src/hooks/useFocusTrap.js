import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * useFocusTrap — atrapa el foco del teclado dentro de un contenedor.
 *
 * Diseñado para modales y diálogos. Al activarse:
 *   1. Guarda el elemento previamente enfocado (para restaurarlo al cerrar)
 *   2. Enfoca el primer elemento focusable del contenedor (o el contenedor mismo)
 *   3. Intercepta Tab/Shift+Tab para mantener el foco dentro
 *   4. Al desactivar, restaura el foco al elemento original
 *
 * Uso:
 *   const ref = useFocusTrap(open)
 *   <div ref={ref} role="dialog" aria-modal="true">...
 *
 * Requisito a11y: el contenedor debe tener role="dialog" y aria-modal="true".
 */
export function useFocusTrap(active) {
  const containerRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return

    previousFocusRef.current = document.activeElement

    // Enfocar primer elemento focusable o el contenedor mismo
    const focusables = container.querySelectorAll(FOCUSABLE_SELECTOR)
    if (focusables.length > 0) {
      focusables[0].focus()
    } else {
      container.setAttribute('tabindex', '-1')
      container.focus()
    }

    const handleKey = (e) => {
      if (e.key !== 'Tab') return
      const list = container.querySelectorAll(FOCUSABLE_SELECTOR)
      if (list.length === 0) {
        e.preventDefault()
        return
      }
      const first = list[0]
      const last = list[list.length - 1]
      const activeEl = document.activeElement

      if (e.shiftKey && activeEl === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && activeEl === last) {
        e.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', handleKey)
    return () => {
      container.removeEventListener('keydown', handleKey)
      // Restaurar foco previo si sigue en el DOM
      const prev = previousFocusRef.current
      if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
        try { prev.focus() } catch { /* no-op */ }
      }
    }
  }, [active])

  return containerRef
}
