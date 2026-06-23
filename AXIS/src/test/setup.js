import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup automático entre tests (desmonta árboles, limpia DOM)
afterEach(() => {
  cleanup()
  try {
    window.localStorage.clear()
    window.sessionStorage.clear()
  } catch { /* no-op */ }
})

// matchMedia stub para componentes que consultan prefers-reduced-motion
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}
