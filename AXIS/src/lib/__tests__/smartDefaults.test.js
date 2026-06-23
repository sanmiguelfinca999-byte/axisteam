import { describe, it, expect } from 'vitest'
import {
  suggestDueDate,
  suggestStoryPoints,
  suggestNextMission,
  tinyNextAction,
  suggestPriority,
} from '../smartDefaults'

const MS_DAY = 86_400_000

describe('suggestDueDate', () => {
  it('CRITICA → +3 días', () => {
    const base = Date.now()
    const due = new Date(suggestDueDate('CRITICA', base)).getTime()
    expect(Math.round((due - base) / MS_DAY)).toBe(3)
  })
  it('NORMAL → +14 días por default', () => {
    const base = Date.now()
    const due = new Date(suggestDueDate('NORMAL', base)).getTime()
    expect(Math.round((due - base) / MS_DAY)).toBe(14)
  })
  it('prioridad desconocida → +7 días (default seguro)', () => {
    const base = Date.now()
    const due = new Date(suggestDueDate('WHATEVER', base)).getTime()
    expect(Math.round((due - base) / MS_DAY)).toBe(7)
  })
})

describe('suggestStoryPoints', () => {
  it('descripción corta → 1-2 pts', () => {
    expect(suggestStoryPoints('NORMAL', 'corto')).toBe(1)
    expect(suggestStoryPoints('NORMAL', 'una frase ligeramente mas larga para llegar a dos puntos')).toBe(2)
  })
  it('descripción larga → más puntos', () => {
    const long = 'a'.repeat(500)
    expect(suggestStoryPoints('NORMAL', long)).toBe(8)
  })
  it('CRITICA hace bump +1 en escala Fibonacci', () => {
    const long = 'a'.repeat(500) // sería 8 en NORMAL
    expect(suggestStoryPoints('CRITICA', long)).toBe(13)
  })
})

describe('suggestNextMission', () => {
  const tasks = [
    { id: 'T1', activoId: 'U1', prioridad: 'NORMAL', progreso: 50, estado: 'EN_PROGRESO', fechaCreacion: '2026-01-01', fechaLimite: '2026-12-31' },
    { id: 'T2', activoId: 'U1', prioridad: 'CRITICA', progreso: 20, estado: 'EN_PROGRESO', fechaCreacion: '2026-01-01', fechaLimite: '2026-12-31' },
    { id: 'T3', activoId: 'U1', prioridad: 'CRITICA', progreso: 70, estado: 'EN_PROGRESO', fechaCreacion: '2026-01-01', fechaLimite: '2026-12-31' },
    { id: 'T4', activoId: 'U2', prioridad: 'CRITICA', progreso: 10, estado: 'EN_PROGRESO', fechaCreacion: '2026-01-01', fechaLimite: '2026-12-31' },
  ]

  it('escoge crítica con menor progreso en solo mode', () => {
    const next = suggestNextMission(tasks, 'U1', true)
    expect(next.id).toBe('T2') // 20% < 70%
  })
  it('ignora tareas de otros usuarios en solo mode', () => {
    const next = suggestNextMission(tasks, 'U1', true)
    expect(next.activoId).toBe('U1')
  })
  it('en squad incluye todas las críticas y devuelve la de menor progreso', () => {
    const next = suggestNextMission(tasks, 'U1', false)
    expect(next.id).toBe('T4') // 10% es el mínimo
  })
  it('devuelve null si no hay nada activo', () => {
    const completed = [{ ...tasks[0], estado: 'COMPLETADA' }]
    expect(suggestNextMission(completed, 'U1', true)).toBe(null)
  })
})

describe('tinyNextAction', () => {
  it('detecta verbos de cierre y sugiere identificar 1 candidato', () => {
    const out = tinyNextAction({ titulo: 'Cerrar 10 clientes este mes' })
    expect(out).toMatch(/Identificar 1 candidato/)
  })
  it('detecta escritura', () => {
    const out = tinyNextAction({ titulo: 'Escribir el capítulo 3' })
    expect(out).toMatch(/primera oración/)
  })
  it('fallback genérico de 2 min', () => {
    const out = tinyNextAction({ titulo: 'Misión sin verbo claro' })
    expect(out).toMatch(/2 min/)
  })
})

describe('suggestPriority', () => {
  it('detecta urgente -> CRITICA', () => {
    expect(suggestPriority('Tarea urgente para hoy')).toBe('CRITICA')
  })
  it('detecta deadline -> ALTA', () => {
    expect(suggestPriority('Entregar antes del viernes, deadline')).toBe('ALTA')
  })
  it('detecta opcional -> BAJA', () => {
    expect(suggestPriority('Nice to have: refactor opcional')).toBe('BAJA')
  })
  it('default NORMAL cuando no hay señal', () => {
    expect(suggestPriority('Algo normal')).toBe('NORMAL')
  })
})
