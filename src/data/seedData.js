// ============================================================
// AXIS v4 SEED DATA
// 11 Operators + Sprint activo + Objective con 3 KRs + Tareas
// Nomenclatura interna conserva nombres legacy (ACTIVOS_*, CORONEL_*)
// para compatibilidad con imports. Terminología visible: ver UI.
// ============================================================

export const CORONEL_CREDENTIALS = {
  username: 'coronel',
  password: 'nexus2024',
  role: 'CORONEL',           // mantenido por compat (RBAC checks)
  nombre: 'Coronel Hansen',
  codename: 'DIRECTOR',
  rolLabel: 'Director',
}

export const ACTIVOS_CREDENTIALS = [
  { id: 'A01', username: 'vega',    password: 'a01',    nombre: 'Sofía Vega',       codename: 'PHANTOM',   especialidad: 'Inteligencia de Datos',   avatar: '🕵️' },
  { id: 'A02', username: 'ramos',   password: 'a02',    nombre: 'Carlos Ramos',     codename: 'CIPHER',    especialidad: 'Operaciones de Campo',    avatar: '⚡' },
  { id: 'A03', username: 'torres',  password: 'a03',    nombre: 'Lucía Torres',     codename: 'NOVA',      especialidad: 'Comunicaciones Tácticas', avatar: '📡' },
  { id: 'A04', username: 'mendez',  password: 'a04',    nombre: 'Diego Méndez',     codename: 'WRAITH',    especialidad: 'Análisis de Amenazas',   avatar: '🔍' },
  { id: 'A05', username: 'reyes',   password: 'a05',    nombre: 'Ana Reyes',        codename: 'SPECTRE',   especialidad: 'Operaciones Digitales',  avatar: '💻' },
  { id: 'A06', username: 'fuentes', password: 'a06',    nombre: 'Marco Fuentes',    codename: 'BLADE',     especialidad: 'Logística y Recursos',   avatar: '📦' },
  { id: 'A07', username: 'santos',  password: 'a07',    nombre: 'Elena Santos',     codename: 'ECHO',      especialidad: 'Contrainteligencia',     avatar: '🛡️' },
  { id: 'A08', username: 'herrera', password: 'a08',    nombre: 'Pablo Herrera',    codename: 'VORTEX',    especialidad: 'Infiltración',           avatar: '🎯' },
  { id: 'A09', username: 'vargas',  password: 'a09',    nombre: 'Isabel Vargas',    codename: 'MIRAGE',    especialidad: 'Análisis Financiero',    avatar: '📊' },
  { id: 'A10', username: 'castillo',password: 'a10',    nombre: 'Rodrigo Castillo', codename: 'STORM',     especialidad: 'Coordinación Regional',  avatar: '🗺️' },
  { id: 'A11', username: 'luna',    password: 'a11',    nombre: 'Valentina Luna',   codename: 'GHOST',     especialidad: 'Operaciones Encubiertas', avatar: '🌙' },
]

// ============================================================
// SCHEMA VERSION (para migraciones)
// ============================================================
export const SCHEMA_VERSION = 'v4.0.0'

// ============================================================
// SPRINT seed — ciclo activo de 2 semanas
// ============================================================
const now = Date.now()
const DAY = 86400000

export const SEED_SPRINTS = [
  {
    id: 'SP-2026-Q2-W3',
    nombre: 'Sprint 24',
    goal: 'Consolidar operación SIGINT Sector Norte y cerrar perfilado Kestrel',
    fechaInicio: new Date(now - 4 * DAY).toISOString(),
    fechaFin:    new Date(now + 10 * DAY).toISOString(),
    estado: 'ACTIVE',
    retro: null,
  },
  {
    id: 'SP-2026-Q2-W5',
    nombre: 'Sprint 25',
    goal: 'Pendiente de planificación',
    fechaInicio: new Date(now + 10 * DAY).toISOString(),
    fechaFin:    new Date(now + 24 * DAY).toISOString(),
    estado: 'UPCOMING',
    retro: null,
  },
]

// ============================================================
// OBJECTIVE + KEY RESULTS — Q3
// ============================================================
export const SEED_OBJECTIVES = [
  {
    id: 'OBJ-Q3-01',
    titulo: 'Reducir tiempo de respuesta a incidentes críticos',
    descripcion: 'Detectar, contener y resolver amenazas en menos de 4 horas con cobertura completa.',
    periodo: 'Q3-2026',
    ownerId: 'A01',
    estado: 'ACTIVE',
    fechaCreacion: new Date(now - 30 * DAY).toISOString(),
  },
]

export const SEED_KEY_RESULTS = [
  { id: 'KR-Q3-01-A', objectiveId: 'OBJ-Q3-01', titulo: 'MTTR menor a 4 horas',           metrica: 'MTTR',          target: 4,   current: 4.9,  unit: 'h',     trend: 'DOWN' },
  { id: 'KR-Q3-01-B', objectiveId: 'OBJ-Q3-01', titulo: 'Cobertura SIGINT 24/7',           metrica: 'Cobertura',     target: 100, current: 54,   unit: '%',     trend: 'UP'   },
  { id: 'KR-Q3-01-C', objectiveId: 'OBJ-Q3-01', titulo: 'NPS interno del equipo ≥ 70',    metrica: 'NPS',           target: 70,  current: 23,   unit: 'pts',   trend: 'UP'   },
]

// ============================================================
// MISSION factory — v4 con campos nuevos
// ============================================================
let taskCounter = 100
const SPRINT_ACTIVO_ID = 'SP-2026-Q2-W3'

const mkTask = (activoId, titulo, descripcion, prioridad = 'NORMAL', progreso = 0, diasRestantes = 5, opts = {}) => {
  const id = `T${++taskCounter}`
  const fechaLimite = new Date(now + diasRestantes * DAY).toISOString()
  return {
    id,
    activoId,
    titulo,
    descripcion,
    prioridad,
    estado: progreso >= 100 ? 'COMPLETADA' : 'EN_PROGRESO',
    progreso: Math.min(100, progreso),
    fechaCreacion: new Date(now - 3 * DAY).toISOString(),
    fechaLimite,
    misionCritica: prioridad === 'CRITICA',
    reasignada: false,
    sirId: null,
    // v4 fields
    sprintId: opts.sprintId ?? SPRINT_ACTIVO_ID,
    keyResultId: opts.keyResultId ?? null,
    bloqueaA: opts.bloqueaA ?? [],
    bloqueadaPor: opts.bloqueadaPor ?? [],
    storyPoints: opts.storyPoints ?? null,
    eventos: [],
  }
}

export const SEED_TASKS = [
  // A01 — Sofía Vega (PHANTOM) — vinculada a KR-01-A y KR-01-B
  mkTask('A01', 'Análisis de patrones SIGINT Sector Norte', 'Procesar 48h de intercepción de señales y generar informe de amenazas', 'CRITICA', 35, 2, { keyResultId: 'KR-Q3-01-B', storyPoints: 8 }),
  mkTask('A01', 'Validación de fuentes HUMINT Alpha', 'Verificar identidad y confiabilidad de 3 fuentes de inteligencia humana', 'ALTA', 70, 4, { keyResultId: 'KR-Q3-01-A', storyPoints: 5 }),
  mkTask('A01', 'Reporte semanal de inteligencia', 'Compilar y sintetizar actividad de la semana para el Director', 'NORMAL', 90, 1, { storyPoints: 2 }),

  // A02 — Carlos Ramos (CIPHER)
  mkTask('A02', 'Reconocimiento Zona Delta-7', 'Reconocimiento físico del perímetro industrial — obtener planos actualizados', 'CRITICA', 20, 1, { keyResultId: 'KR-Q3-01-A', storyPoints: 8 }),
  mkTask('A02', 'Extracción de activo encubierto', 'Coordinar y ejecutar protocolo de extracción segura para agente Omega', 'CRITICA', 55, 3, { storyPoints: 13 }),
  mkTask('A02', 'Entrenamiento evasión técnica', 'Completar módulo 4 de contravigilancia en entorno urbano', 'NORMAL', 100, -1, { storyPoints: 3 }),

  // A03 — Lucía Torres (NOVA)
  mkTask('A03', 'Establecer canal cifrado Bravo-9', 'Configurar y verificar canal de comunicación segura con equipo externo', 'ALTA', 45, 3, { keyResultId: 'KR-Q3-01-B', storyPoints: 5 }),
  mkTask('A03', 'Interferencia de frecuencias Sector Este', 'Analizar origen de interferencias detectadas en banda táctica principal', 'ALTA', 80, 2, { storyPoints: 5 }),
  mkTask('A03', 'Actualización de protocolos de comunicación', 'Revisar e implementar nuevos estándares de cifrado Q4', 'NORMAL', 30, 7, { storyPoints: 8 }),

  // A04 — Diego Méndez (WRAITH)
  mkTask('A04', 'Perfil de amenaza Organización Kestrel', 'Construir perfil completo de la organización adversaria — estructura, capacidades, vulnerabilidades', 'CRITICA', 60, 4, { keyResultId: 'KR-Q3-01-A', storyPoints: 13 }),
  mkTask('A04', 'Análisis de contramedidas Sector Sur', 'Evaluar efectividad de contramedidas desplegadas en el último trimestre', 'ALTA', 40, 5, { storyPoints: 5 }),
  mkTask('A04', 'Briefing de amenazas emergentes', 'Preparar presentación de 15 min sobre nuevas amenazas identificadas', 'NORMAL', 75, 2, { storyPoints: 3 }),

  // A05 — Ana Reyes (SPECTRE)
  mkTask('A05', 'Penetración red interna Objetivo Zeta', 'Acceso y exfiltración de documentos de planificación del objetivo', 'CRITICA', 15, 1, { keyResultId: 'KR-Q3-01-A', storyPoints: 13 }),
  mkTask('A05', 'Análisis de vulnerabilidades infraestructura crítica', 'Auditoría de seguridad en 5 nodos de infraestructura identificados', 'ALTA', 50, 6, { keyResultId: 'KR-Q3-01-B', storyPoints: 8 }),
  mkTask('A05', 'Despliegue de honeypot en red táctica', 'Configurar señuelos digitales para detectar intrusiones enemigas', 'NORMAL', 85, 3, { storyPoints: 5 }),

  // A06 — Marco Fuentes (BLADE)
  mkTask('A06', 'Abastecimiento equipo técnico Operación Meridian', 'Adquisición y distribución de 12 items de equipamiento especializado', 'ALTA', 65, 4, { storyPoints: 5 }),
  mkTask('A06', 'Auditoría de inventario Q2', 'Verificar y actualizar inventario de recursos tácticos y materiales', 'NORMAL', 100, -2, { storyPoints: 3 }),
  mkTask('A06', 'Coordinación transporte seguro — Unidad Foxtrot', 'Planificar y ejecutar traslado de personal clasificado', 'ALTA', 30, 3, { storyPoints: 5 }),

  // A07 — Elena Santos (ECHO)
  mkTask('A07', 'Evaluación de infiltración en Unidad Romeo', 'Detectar posibles elementos comprometidos dentro del equipo aliado', 'CRITICA', 25, 2, { storyPoints: 8 }),
  mkTask('A07', 'Protocolo de verificación de identidad actualizado', 'Implementar nuevo sistema de autenticación biométrica táctica', 'ALTA', 55, 5, { keyResultId: 'KR-Q3-01-C', storyPoints: 5 }),
  mkTask('A07', 'Informe de contraespionaje mensual', 'Análisis de intentos de infiltración detectados en el período', 'NORMAL', 90, 1, { storyPoints: 2 }),

  // A08 — Pablo Herrera (VORTEX)
  mkTask('A08', 'Inserción encubierta — Instalación Omega-3', 'Penetrar y documentar actividad en instalación de alta seguridad', 'CRITICA', 40, 2, { storyPoints: 13 }),
  mkTask('A08', 'Construcción de leyenda — Agente Nuevo', 'Crear identidad completa y verificable para operativo en preparación', 'ALTA', 70, 6, { storyPoints: 8 }),
  mkTask('A08', 'Entrenamiento de nuevos agentes — Fase 2', 'Conducir sesiones de entrenamiento en técnicas de infiltración básica', 'NORMAL', 60, 8, { keyResultId: 'KR-Q3-01-C', storyPoints: 5 }),

  // A09 — Isabel Vargas (MIRAGE)
  mkTask('A09', 'Rastreo de flujos financieros Organización Kestrel', 'Mapear y documentar movimientos de capital sospechosos en 6 jurisdicciones', 'CRITICA', 50, 3, { keyResultId: 'KR-Q3-01-A', storyPoints: 13 }),
  mkTask('A09', 'Análisis de financiamiento de operaciones enemigas', 'Identificar fuentes de financiamiento y canales de distribución de recursos adversarios', 'ALTA', 35, 7, { storyPoints: 8 }),
  mkTask('A09', 'Reporte de anomalías financieras Q2', 'Sintetizar hallazgos del trimestre para evaluación ejecutiva', 'NORMAL', 80, 2, { storyPoints: 3 }),

  // A10 — Rodrigo Castillo (STORM)
  mkTask('A10', 'Coordinación operativa Sectores Norte-Sur', 'Sincronizar actividades de 4 unidades regionales durante ventana crítica', 'CRITICA', 30, 1, { keyResultId: 'KR-Q3-01-B', storyPoints: 8 }),
  mkTask('A10', 'Análisis de terreno — Zona de operaciones Charlie', 'Mapeo táctico y evaluación de rutas de escape y acceso', 'ALTA', 65, 4, { storyPoints: 5 }),
  mkTask('A10', 'Informe de coordinación regional mensual', 'Compilar estado de operaciones en las 3 regiones bajo supervisión', 'NORMAL', 95, 1, { storyPoints: 2 }),

  // A11 — Valentina Luna (GHOST)
  mkTask('A11', 'Operación sombra — Objetivo Ministerio', 'Documentación sin ser detectada de reuniones clave en instalación gubernamental', 'CRITICA', 10, 1, { storyPoints: 13 }),
  mkTask('A11', 'Análisis post-operación Sierra', 'Evaluación exhaustiva de éxitos y fallos de la operación reciente', 'ALTA', 75, 3, { storyPoints: 5 }),
  mkTask('A11', 'Actualización de protocolos de exfiltración', 'Revisar y mejorar procedimientos de extracción de emergencia', 'NORMAL', 55, 6, { storyPoints: 5 }),
]

// ============================================================
// Algoritmo de salud: progreso + saturación + criticidad
// ============================================================
export const calcularSaludActivo = (tasks) => {
  if (!tasks || tasks.length === 0) return { salud: 100, nivel: 'OPERATIVO', color: 'green' }
  const activas = tasks.filter(t => t.estado !== 'COMPLETADA')
  if (activas.length === 0) return { salud: 100, nivel: 'LIBRE', color: 'green' }

  const progresoPromedio = activas.reduce((s, t) => s + t.progreso, 0) / activas.length
  const criticas = activas.filter(t => t.prioridad === 'CRITICA').length
  const vencidas = activas.filter(t => new Date(t.fechaLimite) < new Date()).length

  const indSaturacion = Math.min(100, (activas.length / 4) * 100)
  const penalizacion = (criticas * 15) + (vencidas * 20)
  const salud = Math.max(0, Math.round((progresoPromedio * 0.5) + (100 - indSaturacion) * 0.3 + (100 - penalizacion) * 0.2))

  let nivel, color
  if (salud >= 70)      { nivel = 'OPERATIVO';  color = 'green'  }
  else if (salud >= 40) { nivel = 'SOBRECARGA'; color = 'yellow' }
  else                  { nivel = 'CRISIS';      color = 'red'    }
  return { salud, nivel, color, activas: activas.length, criticas, vencidas }
}

// ============================================================
// Migración soft de tareas v3 → v4
// ============================================================
export const migrateMissionV3ToV4 = (m) => ({
  ...m,
  sprintId:      m.sprintId      ?? SPRINT_ACTIVO_ID,
  keyResultId:   m.keyResultId   ?? null,
  bloqueaA:      m.bloqueaA      ?? [],
  bloqueadaPor:  m.bloqueadaPor  ?? [],
  storyPoints:   m.storyPoints   ?? null,
  eventos:       m.eventos       ?? [],
})
