// ============================================================
// AXIS — TimeBox helpers
// ------------------------------------------------------------
// Compromisos temporales con escala variable:
//
//   pomodoro  -> minutos discretos (25 / 45 / 90)
//   today     -> hasta medianoche local del día actual
//   week      -> hasta domingo 23:59 local
//   custom    -> minutos arbitrarios definidos por el usuario
//
// Pensado para combatir time blindness (TDAH) y soportar planes
// con horizonte más allá de la sesión Pomodoro.
//
// No side effects. No React. Importable desde cualquier capa.
// ============================================================

const MS_SEC = 1000
const MS_MIN = 60 * MS_SEC
const MS_HOUR = 60 * MS_MIN
const MS_DAY = 24 * MS_HOUR

export const MODES = {
  POMODORO: 'pomodoro',
  TODAY: 'today',
  WEEK: 'week',
  CUSTOM: 'custom',
}

const VALID_MODES = new Set(Object.values(MODES))

/**
 * isValidCommitment — guard para sanitizar snapshots de localStorage.
 * Devuelve true sólo si el objeto tiene shape y valores razonables.
 */
export function isValidCommitment(obj) {
  if (!obj || typeof obj !== 'object') return false
  if (!VALID_MODES.has(obj.mode)) return false
  const t = typeof obj.startedAt === 'number' ? obj.startedAt : Date.parse(obj.startedAt)
  if (!Number.isFinite(t)) return false
  // POMODORO/CUSTOM requieren param numérico positivo razonable
  if (obj.mode === MODES.POMODORO || obj.mode === MODES.CUSTOM) {
    const p = Number(obj.param)
    if (!Number.isFinite(p) || p <= 0 || p > 24 * 60) return false
  }
  return true
}

// ============================================================
// targetMillis — devuelve el timestamp absoluto donde termina
// el compromiso, según el modo y un parámetro.
//
//   pomodoro: param = minutos (ej. 25)         -> startedAt + minutos
//   custom:   param = minutos                  -> startedAt + minutos
//   today:    param ignorado                   -> medianoche local
//   week:     param ignorado                   -> domingo 23:59:59.999
// ============================================================
export function targetMillis(mode, startedAt, param = null) {
  const start = typeof startedAt === 'number' ? startedAt : new Date(startedAt).getTime()
  if (mode === MODES.POMODORO || mode === MODES.CUSTOM) {
    const minutes = Number(param) || 25
    return start + minutes * MS_MIN
  }
  if (mode === MODES.TODAY) {
    const d = new Date(start)
    d.setHours(23, 59, 59, 999)
    return d.getTime()
  }
  if (mode === MODES.WEEK) {
    const d = new Date(start)
    // Día de la semana: 0=Dom, 1=Lun, ..., 6=Sáb. Queremos llegar al domingo.
    const dow = d.getDay()
    const daysUntilSunday = dow === 0 ? 0 : 7 - dow
    d.setDate(d.getDate() + daysUntilSunday)
    d.setHours(23, 59, 59, 999)
    return d.getTime()
  }
  return start
}

// ============================================================
// elapsedAndRemaining — segundos transcurridos / restantes
// hasta el target, dado el instante actual.
// ============================================================
export function elapsedAndRemaining(mode, startedAt, param, now = Date.now()) {
  const start = typeof startedAt === 'number' ? startedAt : new Date(startedAt).getTime()
  const target = targetMillis(mode, start, param)
  const totalMs = target - start
  const elapsedMs = Math.max(0, Math.min(now - start, totalMs))
  const remainingMs = Math.max(0, target - now)
  return {
    target,
    totalMs,
    elapsedMs,
    remainingMs,
    finished: now >= target,
    pct: totalMs > 0 ? Math.min(100, Math.round((elapsedMs / totalMs) * 100)) : 0,
  }
}

// ============================================================
// formatRemaining — string legible para el contador.
// Devuelve formato adaptativo según escala:
//   < 1h:  "MM:SS"
//   < 1d:  "Xh YYm"
//   >= 1d: "Xd YYh"
// ============================================================
export function formatRemaining(remainingMs) {
  if (remainingMs <= 0) return '00:00'
  const totalSec = Math.floor(remainingMs / MS_SEC)
  const days = Math.floor(remainingMs / MS_DAY)
  const hoursTotal = Math.floor(remainingMs / MS_HOUR)
  if (days >= 1) {
    const restHours = hoursTotal - days * 24
    return `${days}d ${String(restHours).padStart(2, '0')}h`
  }
  if (hoursTotal >= 1) {
    const restMin = Math.floor((remainingMs - hoursTotal * MS_HOUR) / MS_MIN)
    return `${hoursTotal}h ${String(restMin).padStart(2, '0')}m`
  }
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// ============================================================
// modeLabel / modeHint — copy localizado para UI.
// ============================================================
export function modeLabel(mode) {
  return ({
    [MODES.POMODORO]: 'Sesión Pomodoro',
    [MODES.TODAY]:    'Compromiso de hoy',
    [MODES.WEEK]:     'Compromiso de la semana',
    [MODES.CUSTOM]:   'Bloque personalizado',
  })[mode] || 'Sesión'
}

export function modeHint(mode) {
  return ({
    [MODES.POMODORO]: 'Foco corto con pausa al final',
    [MODES.TODAY]:    'Hoy enfocado en esta misión',
    [MODES.WEEK]:     'Esta semana, esta misión es la prioridad',
    [MODES.CUSTOM]:   'Duración exacta definida por ti',
  })[mode] || ''
}
