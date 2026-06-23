// ============================================================
// AXIS — Smart Defaults
// ------------------------------------------------------------
// Helpers puros que reducen decisión al momento de crear/elegir.
// Diseñados para combatir decision fatigue y task-initiation
// difficulty (relevante en TDAH).
//
// No side effects. No React. Importable desde cualquier capa.
// ============================================================

const MS_DAY = 86_400_000

// ============================================================
// suggestDueDate — devuelve ISO sugerida según prioridad
// ============================================================
//  CRITICA -> +3 días  (presión real)
//  ALTA    -> +7 días  (semana en marcha)
//  NORMAL  -> +14 días (sprint quincenal)
//  BAJA    -> +30 días (mes)
export function suggestDueDate(prioridad, base = Date.now()) {
  const days = ({ CRITICA: 3, ALTA: 7, NORMAL: 14, BAJA: 30 })[prioridad] ?? 7
  return new Date(base + days * MS_DAY).toISOString()
}

// ============================================================
// suggestStoryPoints — Fibonacci estimation por descripción
// ============================================================
//  - Longitud de descripción + prioridad -> puntos
//  - Defaults a 3 (medio día)
//  - Topa en 13 (sprint completo)
export function suggestStoryPoints(prioridad, descripcion = '') {
  const len = (descripcion || '').trim().length
  let base = 3
  if (len < 30) base = 1
  else if (len < 80) base = 2
  else if (len < 200) base = 3
  else if (len < 400) base = 5
  else if (len < 800) base = 8
  else base = 13

  // CRITICA suele subestimarse; bump uno hacia arriba
  if (prioridad === 'CRITICA' && base < 13) {
    const fib = [1, 2, 3, 5, 8, 13]
    const i = fib.indexOf(base)
    return fib[Math.min(i + 1, fib.length - 1)]
  }
  return base
}

// ============================================================
// suggestNextMission — qué hacer AHORA según contexto
// ============================================================
// Reglas:
//  1. Si hay críticas activas -> la crítica con menor progreso (cerca de bloqueo)
//  2. Sino, ALTA con fecha más cercana
//  3. Sino, NORMAL con más días sin tocar (combate desatención)
//  4. Sino, cualquier activa
//  5. Sino, null (no hay nada que sugerir)
export function suggestNextMission(tasks, currentUserId, isSolo) {
  if (!Array.isArray(tasks) || tasks.length === 0) return null
  const scope = isSolo
    ? tasks.filter(t => t.activoId === currentUserId)
    : tasks
  const activas = scope.filter(t => t.estado !== 'COMPLETADA')
  if (activas.length === 0) return null

  const criticas = activas.filter(t => t.prioridad === 'CRITICA')
  if (criticas.length > 0) {
    return criticas.slice().sort((a, b) => (a.progreso ?? 0) - (b.progreso ?? 0))[0]
  }
  const altas = activas.filter(t => t.prioridad === 'ALTA')
  if (altas.length > 0) {
    return altas.slice().sort((a, b) => new Date(a.fechaLimite) - new Date(b.fechaLimite))[0]
  }
  const normales = activas.filter(t => t.prioridad === 'NORMAL')
  if (normales.length > 0) {
    return normales.slice().sort((a, b) => {
      const refA = (a.eventos || [])[0]?.timestamp || a.fechaCreacion
      const refB = (b.eventos || [])[0]?.timestamp || b.fechaCreacion
      return new Date(refA) - new Date(refB)
    })[0]
  }
  return activas[0]
}

// ============================================================
// tinyNextAction — descompone título de misión en paso 2-min
// ============================================================
// Heurística: si la misión empieza con verbo de acción ambicioso
// ("Cerrar 10 clientes"), sugiere su versión micro
// ("Identificar 1 cliente target").
// Sino, sugiere paso genérico de arranque.
export function tinyNextAction(tarea) {
  if (!tarea || !tarea.titulo) return null
  const t = tarea.titulo.toLowerCase()
  const original = tarea.titulo

  if (/^cerrar|cerr[aá]|firmar|conseguir|ganar|adquirir/.test(t)) {
    return 'Identificar 1 candidato concreto para "' + original + '". 2 min.'
  }
  if (/^escribir|redactar|publicar|crear|elaborar/.test(t)) {
    return 'Escribir la primera oración de "' + original + '". Sin editar. 2 min.'
  }
  if (/^leer|estudiar|investigar|revisar/.test(t)) {
    return 'Abrir el material y leer 1 párrafo de "' + original + '". 2 min.'
  }
  if (/^agendar|reuni|llamar|coordinar/.test(t)) {
    return 'Mandar el mensaje para agendar "' + original + '". 2 min.'
  }
  if (/^correr|entrenar|ejercicio|caminar/.test(t)) {
    return 'Ponerte la ropa para "' + original + '". Solo eso. 2 min.'
  }
  if (/^meditar|respira/.test(t)) {
    return 'Cerrar los ojos y respirar 60 segundos. Solo eso. 1 min.'
  }
  // Fallback genérico
  return 'Abrir un cronómetro y trabajar 2 min en "' + original + '". Solo arrancar.'
}

// ============================================================
// suggestPriority — palabras de urgencia en título
// ============================================================
export function suggestPriority(titulo = '') {
  const t = titulo.toLowerCase()
  if (/urgente|cr[ií]tico|hoy|cerrar (\w+ )?hoy|incendio/.test(t)) return 'CRITICA'
  if (/esta semana|antes del|deadline|importante/.test(t)) return 'ALTA'
  if (/cuando pueda|opcional|nice to have|backlog/.test(t)) return 'BAJA'
  return 'NORMAL'
}
