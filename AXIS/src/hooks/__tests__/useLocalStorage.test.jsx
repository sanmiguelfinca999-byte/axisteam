import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../useLocalStorage'

describe('useLocalStorage', () => {
  it('lee initialValue cuando localStorage está vacío', () => {
    const { result } = renderHook(() => useLocalStorage('test-empty', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('lee valor persistido en localStorage', () => {
    window.localStorage.setItem('test-persisted', JSON.stringify({ x: 1 }))
    const { result } = renderHook(() => useLocalStorage('test-persisted', null))
    expect(result.current[0]).toEqual({ x: 1 })
  })

  it('fallback a initialValue cuando JSON está corrupto', () => {
    window.localStorage.setItem('test-corrupt', '{this is not json')
    const { result } = renderHook(() => useLocalStorage('test-corrupt', 'safe'))
    expect(result.current[0]).toBe('safe')
  })

  it('setValue actualiza state y localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-set', 'a'))
    act(() => result.current[1]('b'))
    expect(result.current[0]).toBe('b')
    expect(JSON.parse(window.localStorage.getItem('test-set'))).toBe('b')
  })

  it('setValue acepta función (updater pattern)', () => {
    const { result } = renderHook(() => useLocalStorage('test-fn', 1))
    act(() => result.current[1](prev => prev + 10))
    expect(result.current[0]).toBe(11)
  })

  it('setValue es estable entre renders (referencia idéntica)', () => {
    const { result, rerender } = renderHook(() => useLocalStorage('test-stable', 1))
    const setFirst = result.current[1]
    rerender()
    const setSecond = result.current[1]
    expect(setFirst).toBe(setSecond)
  })

  it('updater pattern captura valor actualizado tras múltiples sets', () => {
    const { result } = renderHook(() => useLocalStorage('test-multi', 0))
    act(() => {
      result.current[1](1)
      result.current[1](v => v + 10)
    })
    expect(result.current[0]).toBe(11)
  })
})
