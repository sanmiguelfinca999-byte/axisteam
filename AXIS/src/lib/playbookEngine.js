// ============================================================
// AXIS — Playbook Engine v2
// ------------------------------------------------------------
// Sistema de matching con scoring multi-dimensional:
//   • Dominio explícito (peso 50)
//   • Keyword match en meta (peso 25)
//   • Frenos compatibles (peso 10)
//   • Tiempo semanal en rango (peso 10)
//   • Métrica compatible (peso 5)
//
// Total max: 100. matchPlaybook devuelve el de mayor score.
// explainPlaybookMatch devuelve top-3 con razones de cada hit.
// ============================================================

import { PLAYBOOKS, PLAYBOOK_BY_ID } from '../data/playbooks'

// Override directo dominio → playbook (lo elegido en el wizard manda)
const DOMAIN_TO_PLAYBOOK = {
  'founder-business':    'founder-business',
  'habits-health':       'habits-health',
  'admin-multifaceted':  'admin-multifaceted',
  'atleta-deportista':   'atleta-deportista',
  'estudiante-examen':   'estudiante-examen',
  'creador-output':      'creador-output',
  'carrera-profesional': 'carrera-profesional',
  'padres-crianza':      'padres-crianza',
  'investigador-tesis':  'investigador-tesis',
  'disenador-output':    'disenador-output',
  'idioma-fluido':       'idioma-fluido',
  'pareja-relacion':     'pareja-relacion',
  'custom':              'custom-okr',
}

// ============================================================
// Signals — características semánticas de cada playbook
// ============================================================
const SIGNALS = {
  'founder-business': {
    metaKeywords: /cliente|venta|mrr|revenue|startup|funder|founder|negocio|empresa|saas|tracci[oó]n|cerrar|pricing|gtm|product\s?market\s?fit|pmf/i,
    frenosBias:   ['claridad', 'tiempo'],
    tiempoMin: 8,  // requiere >= 3h
    tiempoMax: 60,
    medicionPref: ['numerico'],
  },
  'habits-health': {
    metaKeywords: /h[aá]bito|salud|ejercicio|peso|sue[nñ]o|medita|correr|mindful|fitness|gym|yoga|dieta|nutric|paz interior/i,
    frenosBias:   ['disciplina', 'miedo'],
    tiempoMin: 1,
    tiempoMax: 25,
    medicionPref: ['numerico', 'hito'],
  },
  'admin-multifaceted': {
    metaKeywords: /equipo|gerente|director|admin|coordin|multipl|frente|track|operaciones|cargo|empresa familiar|pyme|ong/i,
    frenosBias:   ['tiempo', 'metodo'],
    tiempoMin: 15,
    tiempoMax: 80,
    medicionPref: ['hito', 'cualitativo'],
  },
  'atleta-deportista': {
    metaKeywords: /marat[oó]n|fondo|10k|21k|42k|trail|powerlift|sentadilla|deportist|atleta|pr\b|crossfit|triatl|nataci|ciclism|escalada|musculaci|hipertrofia/i,
    frenosBias:   ['disciplina'],
    tiempoMin: 5,
    tiempoMax: 30,
    medicionPref: ['numerico'],
  },
  'estudiante-examen': {
    metaKeywords: /examen|tesis|certificaci[oó]n|toefl|gre|mcat|usmle|opos|estudi|grados|maestria|maestr[ií]a|posgrado|cohort/i,
    frenosBias:   ['disciplina', 'metodo'],
    tiempoMin: 8,
    tiempoMax: 60,
    medicionPref: ['numerico'],
  },
  'creador-output': {
    metaKeywords: /podcast|youtube|newsletter|blog|crea(r|dor)|publica|content|tiktok|reels|article|video|audiencia|creator/i,
    frenosBias:   ['disciplina', 'miedo'],
    tiempoMin: 3,
    tiempoMax: 25,
    medicionPref: ['numerico'],
  },
  'carrera-profesional': {
    metaKeywords: /promoci[oó]n|ascenso|nivel\s|senior|principal|carrera|skip|mentor|brag|cv|linkedin|networking|cargo nuevo|director|gerente|head/i,
    frenosBias:   ['miedo', 'recursos'],
    tiempoMin: 5,
    tiempoMax: 40,
    medicionPref: ['hito', 'cualitativo'],
  },
  'padres-crianza': {
    metaKeywords: /padre|madre|hijo|hija|crianza|familia|parental|escuela|adolesc|ni[nñ]o|ni[nñ]a|paternidad|maternidad/i,
    frenosBias:   ['tiempo', 'miedo'],
    tiempoMin: 3,
    tiempoMax: 30,
    medicionPref: ['hito', 'cualitativo'],
  },
  'investigador-tesis': {
    metaKeywords: /tesis|doctoral|doctorad|paper|investigac|phd|m[aá]ster|mast[eé]r|capitulo|cap[ií]tulo|publicaci[oó]n academica|lit\s?review|director\s?(de tesis|tesis)/i,
    frenosBias:   ['disciplina', 'miedo'],
    tiempoMin: 10,
    tiempoMax: 60,
    medicionPref: ['numerico'],
  },
  'disenador-output': {
    metaKeywords: /dise[nñ]o|ui|ux|portfolio|figma|illustration|ilustraci|brand|marca|case\s?study|moodboard|design|product designer/i,
    frenosBias:   ['miedo', 'metodo'],
    tiempoMin: 5,
    tiempoMax: 30,
    medicionPref: ['numerico'],
  },
  'idioma-fluido': {
    metaKeywords: /ingl[eé]s|franc[eé]s|alem[aá]n|italiano|portugu[eé]s|japon[eé]s|chino|mandarin|coreano|ruso|idioma|lengua|fluidez|fluido|c1|b2|toefl|delf|dele/i,
    frenosBias:   ['disciplina', 'miedo'],
    tiempoMin: 3,
    tiempoMax: 25,
    medicionPref: ['hito', 'numerico'],
  },
  'pareja-relacion': {
    metaKeywords: /pareja|esposo|esposa|matrimonio|novia|novio|relaci[oó]n|conexi[oó]n|state\s?of|gottman|coupl|amor/i,
    frenosBias:   ['claridad', 'miedo'],
    tiempoMin: 1,
    tiempoMax: 20,
    medicionPref: ['cualitativo', 'hito'],
  },
  'custom-okr': {
    metaKeywords: null,                // No matchea por meta — solo gana por baseline si nadie más responde
    frenosBias:   [],
    tiempoMin: 0,
    tiempoMax: 99,
    medicionPref: ['numerico', 'hito', 'cualitativo'],
  },
}

// ============================================================
// Scoring
// ============================================================
const TIEMPO_BUCKETS = {
  '< 3 h':    2,
  '3 a 7 h':  5,
  '8 a 14 h': 11,
  '15 a 25 h': 20,
  '> 25 h':   30,
}

/**
 * scorePlaybook — calcula 0..100 cuán bueno es un playbook para un diagnóstico.
 * Devuelve objeto con breakdown para transparencia (usado por explainMatch).
 */
export function scorePlaybook(playbookId, diagnostic = {}) {
  const sig = SIGNALS[playbookId]
  if (!sig) return { total: 0, dominio: 0, meta: 0, frenos: 0, tiempo: 0, medicion: 0, razones: [] }
  const razones = []
  let dominio = 0, meta = 0, frenos = 0, tiempo = 0, medicion = 0

  if (diagnostic.dominio && DOMAIN_TO_PLAYBOOK[diagnostic.dominio] === playbookId) {
    dominio = 50
    razones.push('Dominio explícito coincide')
  }

  if (sig.metaKeywords && diagnostic.meta && sig.metaKeywords.test(diagnostic.meta)) {
    meta = 25
    razones.push('Keywords de la meta encajan')
  }

  if (Array.isArray(diagnostic.frenos) && diagnostic.frenos.length > 0 && sig.frenosBias.length > 0) {
    const hit = diagnostic.frenos.filter(f => sig.frenosBias.includes(f)).length
    if (hit > 0) {
      frenos = Math.min(10, hit * 5)
      razones.push(`${hit} freno${hit !== 1 ? 's' : ''} compatible${hit !== 1 ? 's' : ''}`)
    }
  }

  const horasSemanales = TIEMPO_BUCKETS[diagnostic.tiempoSemana]
  if (horasSemanales !== undefined && horasSemanales >= sig.tiempoMin && horasSemanales <= sig.tiempoMax) {
    tiempo = 10
    razones.push('Carga horaria en rango')
  }

  if (diagnostic.medicion && sig.medicionPref.includes(diagnostic.medicion)) {
    medicion = 5
    razones.push('Tipo de medición compatible')
  }

  // El fallback custom-okr arranca con baseline 1 para asegurar que SIEMPRE haya match
  const baseline = playbookId === 'custom-okr' ? 1 : 0
  const total = dominio + meta + frenos + tiempo + medicion + baseline
  return { total, dominio, meta, frenos, tiempo, medicion, razones }
}

/**
 * matchPlaybook — escoge el playbook con mayor score.
 * Devuelve el objeto playbook completo del catálogo.
 */
export function matchPlaybook(diagnostic = {}) {
  let best = null
  let bestScore = -1
  for (const p of PLAYBOOKS) {
    const s = scorePlaybook(p.id, diagnostic).total
    if (s > bestScore) {
      bestScore = s
      best = p
    }
  }
  return best || PLAYBOOK_BY_ID['custom-okr']
}

/**
 * explainPlaybookMatch — transparencia del matching.
 * Devuelve top-3 playbooks con scores y razones de cada uno.
 */
export function explainPlaybookMatch(diagnostic = {}, topN = 3) {
  const ranked = PLAYBOOKS
    .map(p => ({
      id: p.id,
      nombre: p.nombre,
      score: scorePlaybook(p.id, diagnostic),
    }))
    .sort((a, b) => b.score.total - a.score.total)
  return ranked.slice(0, topN)
}

// ============================================================
// Deployment helpers (sin cambios funcionales vs v1)
// ============================================================
export function deployPlaybook(diagnostic = {}) {
  const playbook = matchPlaybook(diagnostic)
  const objective = playbook.generarObjective(diagnostic)
  const krs = playbook.generarKRs(diagnostic)
  const misiones = playbook.generarMisionesIniciales(diagnostic)
  return {
    playbook: { id: playbook.id, nombre: playbook.nombre, vistaHUD: playbook.vistaHUD, ciclo: playbook.ciclo, ritualSemanal: playbook.ritualSemanal },
    objective,
    krs,
    misiones,
    meta: {
      diagnostico: diagnostic,
      generadoEn: new Date().toISOString(),
      consejosClave: playbook.consejosClave,
      metodologia: playbook.metodologia,
      // Top-3 candidatos con razones (para mostrar transparencia opcional)
      candidatos: explainPlaybookMatch(diagnostic, 3),
    },
  }
}

export function deploymentToEntities(deployment, ownerId, sprintId) {
  const now = Date.now()
  const DAY = 86400000

  const objectiveId = `OBJ-${rndId()}`
  const objective = {
    id: objectiveId,
    titulo: deployment.objective.titulo,
    descripcion: deployment.objective.descripcion,
    periodo: deployment.objective.periodo,
    ownerId,
    estado: 'ACTIVE',
    fechaCreacion: new Date().toISOString(),
  }

  const krs = deployment.krs.map((k, i) => ({
    id: `KR-${objectiveId.slice(4)}-${String.fromCharCode(65 + i)}`,
    objectiveId,
    titulo: k.titulo,
    metrica: k.metrica,
    target: k.target,
    current: k.current ?? 0,
    unit: k.unit || '',
    trend: k.trend || 'UP',
    posicion: i,
  }))

  const defaultKrId = krs[0]?.id || null

  const misiones = deployment.misiones.map((m, i) => ({
    id: `T-${rndId()}-${i}`,
    activoId: ownerId,
    titulo: m.titulo,
    descripcion: m.descripcion,
    prioridad: m.prioridad || 'NORMAL',
    estado: 'EN_PROGRESO',
    progreso: 0,
    fechaCreacion: new Date().toISOString(),
    fechaLimite: new Date(now + (m.diasLimite ?? 5) * DAY).toISOString(),
    misionCritica: m.prioridad === 'CRITICA',
    reasignada: false,
    sirId: null,
    sprintId: sprintId || null,
    keyResultId: m.keyResultId || defaultKrId,
    bloqueaA: [],
    bloqueadaPor: [],
    storyPoints: m.storyPoints ?? null,
    eventos: [],
  }))

  return { objective, krs, misiones }
}

// ============================================================
// Catálogo expuesto para el wizard de onboarding
// ============================================================
export const PLAYBOOK_OPTIONS = [
  { id: 'founder-business',    label: 'Founder / Negocio',                       hint: 'Validar producto, cerrar clientes, MRR, lanzamiento.' },
  { id: 'habits-health',       label: 'Hábitos / Salud personal',                hint: 'Identidad, hábito diario, salud, mindfulness, sueño.' },
  { id: 'atleta-deportista',   label: 'Atleta / Deportista',                     hint: 'Periodización, marca objetivo, recuperación, carga semanal.' },
  { id: 'estudiante-examen',   label: 'Estudiante / Examen',                     hint: 'Active recall, Anki, simulacros cronometrados, áreas débiles.' },
  { id: 'creador-output',      label: 'Creador / Output creativo',               hint: 'Cadencia de publicación, deep work, archivo público compuesto.' },
  { id: 'carrera-profesional', label: 'Carrera / Profesional',                   hint: 'Promoción, skill compounding, networking estratégico, brag doc.' },
  { id: 'admin-multifaceted',  label: 'Administración / Multi-frente táctico',   hint: 'Coordinar varios proyectos, equipos o áreas en paralelo.' },
  { id: 'padres-crianza',      label: 'Padres / Crianza activa',                 hint: 'Rituales 1-a-1, conexión, autocuidado del cuidador.' },
  { id: 'investigador-tesis',  label: 'Investigador / Tesis',                    hint: 'Escritura diaria, lit review sistemático, dirección de tesis.' },
  { id: 'disenador-output',    label: 'Diseñador / Output visual',               hint: 'Iteración, critique, portfolio compuesto, process work público.' },
  { id: 'idioma-fluido',       label: 'Idioma / Fluidez',                        hint: 'Input significativo, output frecuente, inmersión bloqueada.' },
  { id: 'pareja-relacion',     label: 'Pareja / Relación',                       hint: 'Bid response, State of the Union, rituales sin pantallas.' },
  { id: 'custom',              label: 'Otro / Personalizado',                    hint: 'No encaja en los anteriores. OKR estándar.' },
]

// ============================================================
// Helpers
// ============================================================
function rndId() {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase()
}
