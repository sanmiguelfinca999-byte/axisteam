import { describe, it, expect } from 'vitest'
import { parseQuickInput, PRIORIDAD_PREFIX } from '../quickParser'

describe('parseQuickInput', () => {
  it('vacío → titulo vacío y prioridad NORMAL', () => {
    expect(parseQuickInput('')).toEqual({ titulo: '', prioridad: 'NORMAL', fromPrefix: false })
    expect(parseQuickInput('   ')).toEqual({ titulo: '', prioridad: 'NORMAL', fromPrefix: false })
    expect(parseQuickInput(null)).toEqual({ titulo: '', prioridad: 'NORMAL', fromPrefix: false })
    expect(parseQuickInput(undefined)).toEqual({ titulo: '', prioridad: 'NORMAL', fromPrefix: false })
  })

  it('prefijo ! → CRITICA y quita el símbolo', () => {
    const r = parseQuickInput('! Mandar el deck hoy')
    expect(r.prioridad).toBe('CRITICA')
    expect(r.titulo).toBe('Mandar el deck hoy')
    expect(r.fromPrefix).toBe(true)
  })

  it('prefijo * → ALTA', () => {
    const r = parseQuickInput('*Llamar al cliente')
    expect(r.prioridad).toBe('ALTA')
    expect(r.titulo).toBe('Llamar al cliente')
    expect(r.fromPrefix).toBe(true)
  })

  it('prefijo - → BAJA', () => {
    const r = parseQuickInput('-leer el artículo')
    expect(r.prioridad).toBe('BAJA')
    expect(r.titulo).toBe('leer el artículo')
    expect(r.fromPrefix).toBe(true)
  })

  it('sin prefijo: detecta urgente -> CRITICA', () => {
    const r = parseQuickInput('Tarea urgente para hoy')
    expect(r.prioridad).toBe('CRITICA')
    expect(r.titulo).toBe('Tarea urgente para hoy')
    expect(r.fromPrefix).toBe(false)
  })

  it('sin prefijo: deadline -> ALTA', () => {
    expect(parseQuickInput('Entregar el reporte deadline viernes').prioridad).toBe('ALTA')
  })

  it('sin prefijo: default NORMAL', () => {
    expect(parseQuickInput('Hacer una cosa').prioridad).toBe('NORMAL')
  })

  it('PRIORIDAD_PREFIX expone el mapa', () => {
    expect(PRIORIDAD_PREFIX['!']).toBe('CRITICA')
    expect(PRIORIDAD_PREFIX['*']).toBe('ALTA')
    expect(PRIORIDAD_PREFIX['-']).toBe('BAJA')
  })

  it('prefijo con espacios alrededor del texto', () => {
    const r = parseQuickInput('!     mucha sangría')
    expect(r.titulo).toBe('mucha sangría')
    expect(r.prioridad).toBe('CRITICA')
  })
})
