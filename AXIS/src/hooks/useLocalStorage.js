import { useState, useEffect, useCallback } from 'react'

/**
 * useLocalStorage — sincroniza una key de localStorage con state React.
 *
 * Memoización crítica: `setValue` es estable (useCallback con deps mínimas).
 * Usa el patrón updater de React (setStoredValue(prev => ...)) para batching
 * correcto cuando hay múltiples llamadas consecutivas y para que múltiples
 * consumers en deps de useMemo/useCallback no provoquen cascadas.
 *
 * Robustez:
 *   - JSON corrupto al leer → log + fallback a initialValue
 *   - Escritura fallida (quota) → log, mantiene state in-memory
 *   - Sync cross-tab vía evento 'storage'
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const item = window.localStorage.getItem(key)
      if (item === null || item === undefined) return initialValue
      return JSON.parse(item)
    } catch (err) {
      console.error(`[useLocalStorage] read corrupt for "${key}":`, err)
      return initialValue
    }
  })

  const setValue = useCallback((value) => {
    setStoredValue(prev => {
      try {
        const next = value instanceof Function ? value(prev) : value
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(next))
        }
        return next
      } catch (err) {
        console.error(`[useLocalStorage] write failed for "${key}":`, err)
        return prev
      }
    })
  }, [key])

  // Sync cross-tab
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleStorage = (e) => {
      if (e.key === key && e.newValue) {
        try { setStoredValue(JSON.parse(e.newValue)) }
        catch (err) { console.error(`[useLocalStorage] sync corrupt for "${key}":`, err) }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key])

  return [storedValue, setValue]
}
