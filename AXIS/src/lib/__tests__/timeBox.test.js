import { describe, it, expect } from 'vitest'
import {
  MODES,
  targetMillis,
  elapsedAndRemaining,
  formatRemaining,
  modeLabel,
  isValidCommitment,
} from '../timeBox'

describe('isValidCommitment', () => {
  it('rechaza null/undefined/no-object', () => {
    expect(isValidCommitment(null)).toBe(false)
    expect(isValidCommitment(undefined)).toBe(false)
    expect(isValidCommitment('string')).toBe(false)
    expect(isValidCommitment(123)).toBe(false)
  })
  it('rechaza modo inválido', () => {
    expect(isValidCommitment({ mode: 'rare', startedAt: Date.now() })).toBe(false)
  })
  it('rechaza startedAt corrupto', () => {
    expect(isValidCommitment({ mode: 'pomodoro', startedAt: 'invalid-date', param: 25 })).toBe(false)
  })
  it('rechaza pomodoro sin param numérico positivo', () => {
    expect(isValidCommitment({ mode: 'pomodoro', startedAt: Date.now() })).toBe(false)
    expect(isValidCommitment({ mode: 'custom', startedAt: Date.now(), param: -5 })).toBe(false)
    expect(isValidCommitment({ mode: 'custom', startedAt: Date.now(), param: 99999 })).toBe(false)
  })
  it('acepta commitment válido pomodoro', () => {
    expect(isValidCommitment({ mode: 'pomodoro', startedAt: Date.now(), param: 25 })).toBe(true)
  })
  it('acepta today/week sin param', () => {
    expect(isValidCommitment({ mode: 'today', startedAt: Date.now() })).toBe(true)
    expect(isValidCommitment({ mode: 'week', startedAt: Date.now() })).toBe(true)
  })
})


const MS_MIN = 60 * 1000
const MS_HOUR = 60 * MS_MIN
const MS_DAY = 24 * MS_HOUR

describe('targetMillis — Pomodoro', () => {
  it('25 min → +25 min desde start', () => {
    const start = 0
    expect(targetMillis(MODES.POMODORO, start, 25)).toBe(25 * MS_MIN)
  })
  it('custom 90 min', () => {
    expect(targetMillis(MODES.CUSTOM, 0, 90)).toBe(90 * MS_MIN)
  })
  it('default param = 25 si no se pasa', () => {
    expect(targetMillis(MODES.POMODORO, 0)).toBe(25 * MS_MIN)
  })
})

describe('targetMillis — Today', () => {
  it('hasta 23:59:59.999 del mismo día local', () => {
    // 2026-06-21 a las 10:00 local
    const start = new Date('2026-06-21T10:00:00').getTime()
    const target = targetMillis(MODES.TODAY, start)
    const d = new Date(target)
    expect(d.getHours()).toBe(23)
    expect(d.getMinutes()).toBe(59)
    expect(d.getDate()).toBe(21)
  })
})

describe('targetMillis — Week', () => {
  it('cuando empieza en lunes, llega al domingo 23:59', () => {
    const start = new Date('2026-06-22T10:00:00').getTime() // lunes
    const target = new Date(targetMillis(MODES.WEEK, start))
    expect(target.getDay()).toBe(0) // domingo
    expect(target.getHours()).toBe(23)
  })
  it('cuando empieza en domingo, target = mismo día 23:59', () => {
    const start = new Date('2026-06-21T10:00:00').getTime() // domingo
    const target = new Date(targetMillis(MODES.WEEK, start))
    expect(target.getDay()).toBe(0)
    expect(target.getDate()).toBe(21)
  })
})

describe('elapsedAndRemaining', () => {
  it('pomodoro 25 min, han pasado 5 → finished=false, remaining=20m', () => {
    const start = 0
    const now = 5 * MS_MIN
    const r = elapsedAndRemaining(MODES.POMODORO, start, 25, now)
    expect(r.finished).toBe(false)
    expect(r.remainingMs).toBe(20 * MS_MIN)
    expect(r.pct).toBe(20)
  })
  it('cuando el tiempo se agotó, finished=true y remaining=0', () => {
    const r = elapsedAndRemaining(MODES.POMODORO, 0, 25, 30 * MS_MIN)
    expect(r.finished).toBe(true)
    expect(r.remainingMs).toBe(0)
    expect(r.pct).toBe(100)
  })
})

describe('formatRemaining', () => {
  it('< 1h → MM:SS', () => {
    expect(formatRemaining(25 * MS_MIN)).toBe('25:00')
    expect(formatRemaining(2 * MS_MIN + 30 * 1000)).toBe('02:30')
  })
  it('< 1d → Xh YYm', () => {
    expect(formatRemaining(3 * MS_HOUR + 15 * MS_MIN)).toBe('3h 15m')
  })
  it('>= 1d → Xd YYh', () => {
    expect(formatRemaining(2 * MS_DAY + 5 * MS_HOUR)).toBe('2d 05h')
  })
  it('0 → 00:00', () => {
    expect(formatRemaining(0)).toBe('00:00')
  })
})

describe('modeLabel', () => {
  it('cada modo tiene label en español', () => {
    expect(modeLabel(MODES.POMODORO)).toMatch(/Pomodoro/)
    expect(modeLabel(MODES.TODAY)).toMatch(/hoy/i)
    expect(modeLabel(MODES.WEEK)).toMatch(/semana/i)
    expect(modeLabel(MODES.CUSTOM)).toMatch(/personalizado/i)
  })
})
