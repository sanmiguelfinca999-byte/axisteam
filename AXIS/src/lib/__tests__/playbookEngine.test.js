import { describe, it, expect } from 'vitest'
import {
  matchPlaybook,
  explainPlaybookMatch,
  scorePlaybook,
  deployPlaybook,
  deploymentToEntities,
} from '../playbookEngine'

describe('scorePlaybook', () => {
  it('da 50 puntos cuando el dominio explícito coincide', () => {
    const s = scorePlaybook('founder-business', { dominio: 'founder-business' })
    expect(s.dominio).toBe(50)
    expect(s.total).toBeGreaterThanOrEqual(50)
  })

  it('da 25 puntos por keyword en meta', () => {
    const s = scorePlaybook('atleta-deportista', { meta: 'correr un maratón en 4 horas' })
    expect(s.meta).toBe(25)
  })

  it('suma puntos por frenos compatibles (5 por hit, max 10)', () => {
    const s = scorePlaybook('habits-health', { frenos: ['disciplina', 'miedo'] })
    expect(s.frenos).toBe(10)
  })

  it('da 10 puntos cuando el tiempo está en rango del playbook', () => {
    const s = scorePlaybook('founder-business', { tiempoSemana: '15 a 25 h' })
    expect(s.tiempo).toBe(10)
  })

  it('da 5 puntos cuando la medición preferida coincide', () => {
    const s = scorePlaybook('founder-business', { medicion: 'numerico' })
    expect(s.medicion).toBe(5)
  })

  it('custom-okr siempre devuelve >= 1 (baseline)', () => {
    const s = scorePlaybook('custom-okr', {})
    expect(s.total).toBeGreaterThanOrEqual(1)
  })

  it('expone razones en breakdown', () => {
    const s = scorePlaybook('founder-business', {
      dominio: 'founder-business',
      meta: 'cerrar 10 clientes nuevos',
      frenos: ['claridad'],
    })
    expect(s.razones.length).toBeGreaterThan(0)
  })
})

describe('matchPlaybook', () => {
  it('matchea founder-business por dominio explícito', () => {
    const p = matchPlaybook({ dominio: 'founder-business' })
    expect(p.id).toBe('founder-business')
  })

  it('matchea habits-health por meta libre', () => {
    const p = matchPlaybook({ meta: 'meditar 10 minutos diarios' })
    expect(p.id).toBe('habits-health')
  })

  it('matchea atleta-deportista por meta libre con marca', () => {
    const p = matchPlaybook({ meta: 'bajar mi marca de 10k a 42 minutos' })
    expect(p.id).toBe('atleta-deportista')
  })

  it('matchea estudiante-examen por meta', () => {
    const p = matchPlaybook({ meta: 'aprobar el examen TOEFL con 100 puntos' })
    expect(p.id).toBe('estudiante-examen')
  })

  it('cae a custom-okr cuando no hay señales', () => {
    const p = matchPlaybook({})
    expect(p.id).toBe('custom-okr')
  })

  it('el dominio explícito gana sobre meta ambigua', () => {
    const p = matchPlaybook({
      dominio: 'pareja-relacion',
      meta: 'cerrar mas clientes',  // suena a founder, pero dominio manda
    })
    expect(p.id).toBe('pareja-relacion')
  })
})

describe('explainPlaybookMatch', () => {
  it('devuelve top-3 con scores descendentes', () => {
    const top = explainPlaybookMatch({ dominio: 'investigador-tesis', meta: 'escribir mi tesis doctoral' })
    expect(top).toHaveLength(3)
    expect(top[0].score.total).toBeGreaterThanOrEqual(top[1].score.total)
    expect(top[1].score.total).toBeGreaterThanOrEqual(top[2].score.total)
  })

  it('el ganador tiene razones explicadas', () => {
    const top = explainPlaybookMatch({ dominio: 'creador-output', meta: 'publicar 12 videos en youtube' })
    expect(top[0].id).toBe('creador-output')
    expect(top[0].score.razones.length).toBeGreaterThan(0)
  })
})

describe('deployPlaybook', () => {
  it('devuelve forma Deployment válida', () => {
    const d = deployPlaybook({ dominio: 'habits-health', meta: 'meditar diariamente' })
    expect(d.playbook.id).toBe('habits-health')
    expect(d.objective.titulo).toBeTruthy()
    expect(d.krs.length).toBeGreaterThan(0)
    expect(d.misiones.length).toBeGreaterThan(0)
    expect(d.meta.candidatos.length).toBe(3) // explainPlaybookMatch embebido
  })

  it('los KRs tienen estructura { titulo, metrica, target, current, unit, trend }', () => {
    const d = deployPlaybook({ dominio: 'founder-business', meta: 'cerrar 10 clientes' })
    for (const kr of d.krs) {
      expect(kr.titulo).toBeTruthy()
      expect(typeof kr.target).toBe('number')
      expect(typeof kr.current).toBe('number')
      expect(['UP', 'DOWN']).toContain(kr.trend)
    }
  })
})

describe('deploymentToEntities', () => {
  it('asigna IDs únicos y vincula KRs al objetivo', () => {
    const d = deployPlaybook({ dominio: 'custom' })
    const e = deploymentToEntities(d, 'USER-1', 'SP-2026')
    expect(e.objective.id).toMatch(/^OBJ-/)
    expect(e.objective.ownerId).toBe('USER-1')
    for (const kr of e.krs) {
      expect(kr.objectiveId).toBe(e.objective.id)
    }
    for (const m of e.misiones) {
      expect(m.id).toMatch(/^T-/)
      expect(m.activoId).toBe('USER-1')
      expect(m.sprintId).toBe('SP-2026')
      expect(m.keyResultId).toBe(e.krs[0].id) // vínculo al primer KR
    }
  })
})
