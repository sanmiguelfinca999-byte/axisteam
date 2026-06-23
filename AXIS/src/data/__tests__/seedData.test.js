import { describe, it, expect } from 'vitest'
import { calcularSaludActivo, migrateMissionV3ToV4 } from '../seedData'

describe('calcularSaludActivo', () => {
  it('devuelve salud 100 / OPERATIVO cuando no hay tareas', () => {
    const r = calcularSaludActivo([])
    expect(r.salud).toBe(100)
    expect(r.nivel).toBe('OPERATIVO')
  })

  it('marca salud baja (CHARLIE) cuando hay críticas vencidas', () => {
    const past = new Date(Date.now() - 7 * 86400000).toISOString()
    const tareas = [
      { prioridad: 'CRITICA', progreso: 10, estado: 'EN_PROGRESO', fechaLimite: past },
      { prioridad: 'CRITICA', progreso: 0,  estado: 'EN_PROGRESO', fechaLimite: past },
      { prioridad: 'ALTA',    progreso: 0,  estado: 'EN_PROGRESO', fechaLimite: past },
    ]
    const r = calcularSaludActivo(tareas)
    expect(r.salud).toBeLessThan(40)
  })

  it('marca OPERATIVO cuando todo va bien', () => {
    const future = new Date(Date.now() + 7 * 86400000).toISOString()
    const tareas = [
      { prioridad: 'NORMAL', progreso: 80, estado: 'EN_PROGRESO', fechaLimite: future },
      { prioridad: 'NORMAL', progreso: 90, estado: 'EN_PROGRESO', fechaLimite: future },
    ]
    const r = calcularSaludActivo(tareas)
    expect(r.salud).toBeGreaterThanOrEqual(70)
    expect(r.nivel).toBe('OPERATIVO')
  })
})

describe('migrateMissionV3ToV4', () => {
  it('agrega defaults faltantes preservando datos existentes', () => {
    const v3 = {
      id: 'T-OLD',
      titulo: 'Mision vieja',
      progreso: 30,
      estado: 'EN_PROGRESO',
    }
    const v4 = migrateMissionV3ToV4(v3)
    expect(v4.id).toBe('T-OLD')
    expect(v4.titulo).toBe('Mision vieja')
    expect(v4.progreso).toBe(30)
    expect(v4.bloqueaA).toEqual([])
    expect(v4.bloqueadaPor).toEqual([])
    expect(typeof v4.sprintId === 'string' || v4.sprintId === null).toBe(true)
    expect(typeof v4.keyResultId === 'string' || v4.keyResultId === null).toBe(true)
    expect(Array.isArray(v4.eventos)).toBe(true)
  })

  it('no sobreescribe campos ya v4', () => {
    const v4Input = {
      id: 'T-NEW', titulo: 'X', progreso: 50, estado: 'EN_PROGRESO',
      bloqueaA: ['T-OTRA'], sprintId: 'SP-1',
    }
    const out = migrateMissionV3ToV4(v4Input)
    expect(out.bloqueaA).toEqual(['T-OTRA'])
    expect(out.sprintId).toBe('SP-1')
  })
})
