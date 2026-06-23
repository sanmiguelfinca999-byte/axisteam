import { render } from '@testing-library/react'
import { NEXUSProvider } from '../context/NEXUSContext'

/**
 * renderWithProviders — helper para tests de componentes que consumen
 * el NEXUSContext. Envuelve el componente con el provider real.
 *
 * Acepta seed (objeto con keys de localStorage) para precargar estado.
 * Útil cuando un test necesita un estado específico antes del primer render.
 */
export function renderWithProviders(ui, { seed = null, ...options } = {}) {
  if (seed && typeof window !== 'undefined') {
    for (const [key, value] of Object.entries(seed)) {
      window.localStorage.setItem(key, JSON.stringify(value))
    }
  }
  return render(<NEXUSProvider>{ui}</NEXUSProvider>, options)
}
