// ============================================================
// AXIS — Mission Templates
// 5 templates pre-armadas para reducir fricción de creación
// Cada template define defaults razonables; el Director puede ajustar
// ============================================================

export const MISSION_TEMPLATES = [
  {
    id: 'onboarding',
    nombre: 'Onboarding de nuevo miembro',
    icon: '🎯',
    descripcionCorta: 'Nivelación + accesos + primer impacto',
    defaults: {
      titulo: 'Onboarding — [Nombre del nuevo miembro]',
      descripcion: 'Plan de 30/60/90 días.\n\n— Semana 1: accesos, intro al equipo, lectura de docs core.\n— Semana 2-4: primer commit / primera entrega menor.\n— Mes 2: ownership de un componente.\n— Mes 3: medición de fit + plan de carrera.',
      prioridad: 'NORMAL',
      storyPoints: 8,
      diasDuracion: 30,
    },
  },
  {
    id: 'deploy',
    nombre: 'Deploy a producción',
    icon: '🚀',
    descripcionCorta: 'Release controlado con rollback plan',
    defaults: {
      titulo: 'Deploy v[X.Y.Z] a producción',
      descripcion: 'Release de [feature].\n\n— Pre-deploy: code review aprobado, tests en verde, staging validado.\n— Deploy: ventana acordada, comunicación al equipo, feature flag inicial OFF.\n— Post-deploy: monitoreo 24h, smoke test, activación gradual.\n— Rollback plan: revert via git tag previo si métricas degradan >5%.',
      prioridad: 'ALTA',
      storyPoints: 5,
      diasDuracion: 3,
    },
  },
  {
    id: 'launch',
    nombre: 'Launch de feature',
    icon: '📢',
    descripcionCorta: 'Lanzamiento público con comunicación',
    defaults: {
      titulo: 'Launch — [Nombre de la feature]',
      descripcion: 'Lanzamiento de [feature] al público.\n\n— Pre-launch: assets de marketing, copy revisado, beta cerrada validada.\n— Día 0: deploy en producción, anuncio en canal oficial, monitoreo activo.\n— Semana 1: tracking de adopción, recolección de feedback, hotfix si aplica.\n— Retro a 2 semanas con métricas: usuarios alcanzados, conversión, NPS.',
      prioridad: 'ALTA',
      storyPoints: 13,
      diasDuracion: 14,
    },
  },
  {
    id: 'post-mortem',
    nombre: 'Post-mortem de incidente',
    icon: '🔍',
    descripcionCorta: 'Análisis sin culpa + acciones preventivas',
    defaults: {
      titulo: 'Post-mortem — [Incidente del DD/MM]',
      descripcion: 'Análisis blameless del incidente.\n\n— Timeline: secuencia exacta de eventos con timestamps.\n— Impacto: usuarios/operaciones afectadas, duración, severidad.\n— Causa raíz: técnica + factores contribuyentes (procesos, comunicación).\n— Lo que funcionó bien.\n— Acciones correctivas con owners y deadlines.\n— Plazo: cerrar todas las acciones en <2 semanas.',
      prioridad: 'CRITICA',
      storyPoints: 5,
      diasDuracion: 7,
    },
  },
  {
    id: 'hiring',
    nombre: 'Cierre de proceso de hiring',
    icon: '👥',
    descripcionCorta: 'Pipeline completo: sourcing → oferta',
    defaults: {
      titulo: 'Hiring — [Rol] · ciclo [Q]',
      descripcion: 'Llenar la posición de [rol] en este ciclo.\n\n— Sourcing: 30 candidatos en pipeline.\n— Screening: 10 entrevistas iniciales.\n— Loops técnicos: 5 candidatos.\n— Loops culturales: 3 candidatos finalistas.\n— Decisión + oferta: máximo 5 días business desde último loop.\n— Cierre: contrato firmado y kickoff date acordado.',
      prioridad: 'ALTA',
      storyPoints: 13,
      diasDuracion: 30,
    },
  },
]

export const getTemplate = (id) => MISSION_TEMPLATES.find(t => t.id === id)
