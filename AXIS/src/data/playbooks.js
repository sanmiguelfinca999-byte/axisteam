const DAY = 86400000

const slug = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)
const makeMission = (titulo, descripcion, prioridad, diasLimite, opts = {}) => ({
  titulo,
  descripcion,
  prioridad,
  diasLimite,
  storyPoints: opts.storyPoints ?? null,
  keyResultId: opts.keyResultId ?? null,
})

const founderPlaybook = {
  id: 'founder-business',
  nombre: 'Founder / Negocio',
  descripcion: 'OKR trimestral + experimentos semanales. Pipeline de adquisición visible. Deep work como músculo no-negociable.',
  metodologia: 'OKR (Doerr) + Lean experiments (Ries) + Deep Work blocks (Newport)',
  ciclo: 'quincenal',
  vistaHUD: 'pipeline',
  ritualSemanal: { dia: 'lunes', hora: '09:00', tipo: 'planning', duracionMin: 45 },
  consejosClave: [
    'La meta del trimestre se mide en outcomes (clientes, MRR, retención), no en outputs (features enviadas).',
    'Cada KR debe tener un experimento semanal que lo mueva. Si no, replantea el KR.',
    'Bloquea 2 sesiones de Deep Work de 90 min cada semana en el calendario antes de aceptar reuniones.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Cerrar el trimestre con tracción de mercado',
    descripcion: d.porQue || 'Validar que el producto resuelve un problema real con willingness-to-pay.',
    periodo: defaultPeriodo(d.horizonteMeses || 3),
  }),
  generarKRs: (d) => {
    const meta = (d.meta || '').toLowerCase()
    const numero = extraerNumero(d.meta) || 10
    const krs = []
    if (/cliente|usuari|paying|customer|venta/.test(meta)) {
      krs.push(kr('Customers de pago', 'paying_customers', numero, 0, '', 'UP'))
      krs.push(kr('Demos calificadas / semana', 'qualified_demos_week', 5, 0, '', 'UP'))
    } else if (/ingres|mrr|revenue|facturaci/.test(meta)) {
      krs.push(kr('MRR', 'mrr', numero, 0, 'USD', 'UP'))
      krs.push(kr('Churn mensual', 'churn_monthly', 5, 100, '%', 'DOWN'))
    } else if (/lanz|launch|salir/.test(meta)) {
      krs.push(kr('Beta users activos', 'beta_active', 50, 0, '', 'UP'))
      krs.push(kr('Feedback sessions semana', 'feedback_sessions', 3, 0, '', 'UP'))
    } else {
      krs.push(kr('Outcomes principales', 'principal_outcome', numero, 0, '', 'UP'))
      krs.push(kr('Conversaciones discovery / semana', 'discovery_chats', 5, 0, '', 'UP'))
    }
    krs.push(kr('Sesiones Deep Work / semana', 'deep_work_sessions', 4, 0, '', 'UP'))
    return krs
  },
  generarMisionesIniciales: (d) => [
    makeMission('Definir hipótesis del trimestre', 'Escribir 1 hipótesis falseable que conecte el problema, la propuesta y la métrica de éxito.', 'CRITICA', 2, { storyPoints: 3 }),
    makeMission('Identificar 5 conversaciones discovery esta semana', 'Lista de 5 personas en el ICP que aceptarán 20 min de tu tiempo.', 'ALTA', 3, { storyPoints: 5 }),
    makeMission('Bloquear 2 sesiones Deep Work', 'Calendario, 90 min cada una, sin notificaciones. Tema concreto por sesión.', 'ALTA', 1, { storyPoints: 2 }),
    makeMission('Definir el experimento de la próxima semana', 'Una sola palanca a mover. Hipótesis, métrica, criterio de éxito, plazo.', 'NORMAL', 5, { storyPoints: 3 }),
  ],
}

const habitosPlaybook = {
  id: 'habits-health',
  nombre: 'Hábitos / Salud personal',
  descripcion: 'Identidad-based habits. Fricción mínima. Streak diaria como evidencia, no como castigo.',
  metodologia: 'Atomic Habits (Clear) + BJ Fogg Tiny Habits + Implementation Intentions',
  ciclo: 'semanal',
  vistaHUD: 'streak',
  ritualSemanal: { dia: 'domingo', hora: '19:00', tipo: 'planning', duracionMin: 20 },
  consejosClave: [
    'Empieza ridículamente pequeño. 2 minutos diarios beats 60 minutos esporádicos.',
    'Anclajes: define "después de X, hago Y". El cerebro no decide, ejecuta el ancla.',
    'No rompas la cadena dos veces seguidas. Una vez es accidente, dos es nuevo hábito.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Construir la identidad que persigo',
    descripcion: d.porQue || 'Convertirme en alguien para quien estos hábitos son lo natural.',
    periodo: defaultPeriodo(d.horizonteMeses || 3),
  }),
  generarKRs: (d) => {
    const meta = (d.meta || '').toLowerCase()
    const krs = []
    if (/correr|running|sprint|maratón|atletismo/.test(meta)) {
      const numero = extraerNumero(d.meta)
      krs.push(kr('Sesiones de entrenamiento / semana', 'training_sessions', 5, 0, '', 'UP'))
      krs.push(kr(numero ? `Marca objetivo (${numero})` : 'Marca objetivo', 'target_mark', numero || 100, 0, '', 'DOWN'))
    } else if (/peso|kilo|fitness|cuerpo/.test(meta)) {
      krs.push(kr('Días con entrenamiento', 'workout_days_week', 4, 0, '', 'UP'))
      krs.push(kr('Comidas alineadas / semana', 'meals_aligned', 18, 0, '', 'UP'))
    } else if (/medita|mindful|paz|estr[eé]s/.test(meta)) {
      krs.push(kr('Días con sesión de meditación', 'meditation_days', 7, 0, '', 'UP'))
      krs.push(kr('Minutos diarios promedio', 'meditation_avg_min', 15, 0, 'min', 'UP'))
    } else if (/dormir|sueño|descanso/.test(meta)) {
      krs.push(kr('Horas de sueño promedio', 'sleep_hours_avg', 8, 0, 'h', 'UP'))
      krs.push(kr('Días con bedtime consistente', 'consistent_bedtime', 6, 0, '', 'UP'))
    } else {
      krs.push(kr('Días con el hábito principal', 'main_habit_days', 6, 0, '', 'UP'))
      krs.push(kr('Streak más larga', 'longest_streak', 30, 0, 'días', 'UP'))
    }
    return krs
  },
  generarMisionesIniciales: (d) => [
    makeMission('Definir la versión ridícula del hábito', 'La versión de 2 minutos que NO PUEDES fallar. Esa es la entrada.', 'CRITICA', 1, { storyPoints: 2 }),
    makeMission('Diseñar 1 anclaje claro', 'Después de [actividad ya establecida], hago [nuevo hábito]. Escríbelo.', 'ALTA', 1, { storyPoints: 2 }),
    makeMission('Quitar 1 fricción del entorno', 'Hacer obvio y fácil. Saca al pasillo lo que necesitas, esconde lo que distrae.', 'ALTA', 2, { storyPoints: 2 }),
    makeMission('Sesión piloto', 'Ejecuta hoy. Marca como completada al volver. La evidencia construye identidad.', 'NORMAL', 1, { storyPoints: 1 }),
  ],
}

const adminMultifacetedPlaybook = {
  id: 'admin-multifaceted',
  nombre: 'Administración / Multifacético táctico',
  descripcion: 'Orquestación de múltiples frentes con prioridad táctica diaria y revisión semanal estratégica. Visibilidad por dominio, no por proyecto.',
  metodologia: "Eisenhower matrix + Weekly Review (Allen, GTD) + Theater commander's decision cycle (OODA loop)",
  ciclo: 'semanal',
  vistaHUD: 'multi-track',
  ritualSemanal: { dia: 'viernes', hora: '17:00', tipo: 'review', duracionMin: 60 },
  consejosClave: [
    'Cada misión debe pertenecer a un frente (track). Si no encaja en ninguno, abre uno o descártalo.',
    'Lunes: prioriza por urgencia + impacto en la meta del trimestre. Viernes: revisa qué quedó vivo y por qué.',
    'Tu rol no es ejecutar todo, es decidir qué se hace, qué se delega, qué se elimina. Si haces todo, fallas en lo que importa.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Mantener coherencia operativa entre frentes simultáneos',
    descripcion: d.porQue || 'Que ningún frente fracase por desatención mientras avanzas en los prioritarios.',
    periodo: defaultPeriodo(d.horizonteMeses || 3),
  }),
  generarKRs: (d) => {
    const tracks = (d.tracks && d.tracks.length > 0) ? d.tracks : ['Operación', 'Estrategia', 'Personas']
    const krs = []
    krs.push(kr('Frentes con avance esta semana', 'fronts_with_progress', tracks.length, 0, 'frentes', 'UP'))
    krs.push(kr('Revisiones semanales completadas', 'weekly_reviews_done', 12, 0, '', 'UP'))
    krs.push(kr('Decisiones críticas tomadas a tiempo', 'critical_decisions_ontime', 90, 0, '%', 'UP'))
    return krs
  },
  generarMisionesIniciales: (d) => {
    const tracks = (d.tracks && d.tracks.length > 0) ? d.tracks : ['Operación', 'Estrategia', 'Personas']
    const out = [
      makeMission('Mapear los frentes activos', 'Lista honesta de cada track que estás cargando hoy. Mínimo 1, ideal 3-5, alerta si >7.', 'CRITICA', 1, { storyPoints: 3 }),
      makeMission('Identificar el frente desatendido', 'Cuál track no recibió atención en las últimas 2 semanas. Esa es tu deuda silenciosa.', 'ALTA', 2, { storyPoints: 2 }),
      makeMission('Agendar Weekly Review recurrente', 'Bloque de 60 min en calendario. Mismo día, misma hora. No-negociable.', 'ALTA', 3, { storyPoints: 2 }),
    ]
    tracks.slice(0, 3).forEach(t => {
      out.push(makeMission(`Primer avance en: ${t}`, `Una acción concreta que mueva el frente "${t}" esta semana.`, 'NORMAL', 5, { storyPoints: 3 }))
    })
    return out
  },
}

const atletaPlaybook = {
  id: 'atleta-deportista',
  nombre: 'Atleta / Deportista',
  descripcion: 'Periodización por bloques + RPE-based load + recuperación protegida. La marca no se construye en la sesión de hoy, se construye en el bloque.',
  metodologia: 'Block periodization (Issurin) + RPE-based load (Helms) + Polarized training (Seiler)',
  ciclo: 'semanal',
  vistaHUD: 'streak',
  ritualSemanal: { dia: 'domingo', hora: '20:00', tipo: 'planning', duracionMin: 30 },
  consejosClave: [
    'La consistencia bate al heroísmo. 5 sesiones de 80% intensidad superan 1 de 100% más 4 de 40%.',
    'Recuperación es entrenamiento. Sueño <7 h o RPE >8 dos días seguidos: bajas intensidad sin pedir permiso.',
    'Mide carga, no esfuerzo emocional. Volumen × RPE = unidad de carga semanal.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Llegar al pico de forma en la fecha objetivo',
    descripcion: d.porQue || 'Ejecutar el bloque con disciplina técnica y carga progresiva.',
    periodo: defaultPeriodo(d.horizonteMeses || 3),
  }),
  generarKRs: (d) => {
    const meta = (d.meta || '').toLowerCase()
    const numero = extraerNumero(d.meta)
    const krs = []
    if (/marat[oó]n|fondo|10k|21k|42k|trail/.test(meta)) {
      krs.push(kr('Kilómetros / semana', 'km_week', 50, 0, 'km', 'UP'))
      krs.push(kr(numero ? `Marca objetivo (${numero})` : 'Marca objetivo', 'target_mark', numero || 100, 0, 'min', 'DOWN'))
    } else if (/fuerza|powerlift|strength|sentadilla|pr\b/.test(meta)) {
      krs.push(kr('Sesiones de fuerza / semana', 'strength_sessions', 4, 0, '', 'UP'))
      krs.push(kr(numero ? `1RM objetivo (${numero})` : 'PR objetivo', 'pr_target', numero || 100, 0, 'kg', 'UP'))
    } else {
      krs.push(kr('Sesiones / semana', 'sessions_week', 5, 0, '', 'UP'))
      krs.push(kr(numero ? `Métrica objetivo (${numero})` : 'Marca objetivo', 'target_mark', numero || 100, 0, '', 'UP'))
    }
    krs.push(kr('Horas de sueño promedio', 'sleep_hours', 8, 0, 'h', 'UP'))
    krs.push(kr('Días sin sobrecarga (RPE <= 8)', 'safe_load_days', 6, 0, '', 'UP'))
    return krs
  },
  generarMisionesIniciales: (d) => [
    makeMission('Diagnóstico baseline', 'Mide tu marca actual sin presión. Es el punto cero del bloque.', 'CRITICA', 2, { storyPoints: 3 }),
    makeMission('Construir microciclo semanal', 'Distribuye intensidades (polarizado): 2 sesiones HIIT, 3 de volumen, 2 descanso activo.', 'ALTA', 3, { storyPoints: 5 }),
    makeMission('Bloquear recuperación', 'Agenda sueño y movilidad como sesiones. No-negociables.', 'ALTA', 1, { storyPoints: 2 }),
    makeMission('Definir métrica de tracking diaria', 'RPE + minutos + sensaciones. Una nota corta al final del día.', 'NORMAL', 2, { storyPoints: 2 }),
  ],
}

const estudiantePlaybook = {
  id: 'estudiante-examen',
  nombre: 'Estudiante / Examen',
  descripcion: 'Spaced repetition + active recall + simulacros con feedback rápido. El examen se gana en la curva de olvido, no en maratones la noche anterior.',
  metodologia: 'Spaced repetition (Ebbinghaus, Anki) + Active recall (Roediger) + Interleaving (Bjork)',
  ciclo: 'semanal',
  vistaHUD: 'streak',
  ritualSemanal: { dia: 'domingo', hora: '18:00', tipo: 'planning', duracionMin: 30 },
  consejosClave: [
    'Leer no es estudiar. Si no te puedes auto-explicar el concepto en 30 s, no lo dominas.',
    'Distribuye, no acumules. 7 sesiones de 25 min superan 1 de 3 horas.',
    'Simula. Cada semana hazte una versión cronometrada de examen real.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Aprobar el examen con margen de seguridad',
    descripcion: d.porQue || 'Dominar las áreas críticas y eliminar puntos débiles antes del día D.',
    periodo: defaultPeriodo(d.horizonteMeses || 3),
  }),
  generarKRs: () => [
    kr('Tarjetas de Anki creadas', 'anki_cards', 200, 0, '', 'UP'),
    kr('Sesiones de active recall / semana', 'recall_sessions', 14, 0, '', 'UP'),
    kr('Simulacros cronometrados', 'mock_exams', 8, 0, '', 'UP'),
    kr('Score promedio en simulacros', 'mock_avg', 85, 0, '%', 'UP'),
  ],
  generarMisionesIniciales: () => [
    makeMission('Mapear áreas del examen', 'Lista todos los temas con peso porcentual aproximado. Eso es tu mapa de carga.', 'CRITICA', 2, { storyPoints: 3 }),
    makeMission('Identificar 3 áreas más débiles', 'Auto-diagnóstico honesto. Esas se atacan primero.', 'ALTA', 2, { storyPoints: 2 }),
    makeMission('Setup Anki + crear primeras 30 tarjetas', 'Configura deck y crea tarjetas del área más débil. Una por concepto.', 'ALTA', 3, { storyPoints: 5 }),
    makeMission('Agendar simulacro semanal', 'Bloque de 2-3 h en calendario, día fijo. Mismas condiciones que el examen real.', 'NORMAL', 5, { storyPoints: 2 }),
  ],
}

const creadorPlaybook = {
  id: 'creador-output',
  nombre: 'Creador / Output creativo',
  descripcion: 'Cadencia de publicación + deep work blocks + iteración pública. La autoridad creativa se construye por volumen consistente, no por piezas perfectas.',
  metodologia: 'Show Your Work (Kleon) + Deep Work (Newport) + Build in Public + Compound publishing',
  ciclo: 'semanal',
  vistaHUD: 'multi-track',
  ritualSemanal: { dia: 'viernes', hora: '17:00', tipo: 'review', duracionMin: 45 },
  consejosClave: [
    'Publica con regularidad antes que con perfección. 52 piezas medianas baten a 4 obras maestras.',
    'Separa creación (deep work) de distribución (engagement). Mezclarlas mata las dos.',
    'Tu archivo es tu capital. Cada pieza publicada compone con las anteriores. Mantén el ritmo.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Construir un cuerpo de trabajo público y consistente',
    descripcion: d.porQue || 'Que el archivo trabaje por mí en 12 meses, no que cada pieza tenga que viralizarse.',
    periodo: defaultPeriodo(d.horizonteMeses || 3),
  }),
  generarKRs: (d) => {
    const meta = (d.meta || '').toLowerCase()
    const numero = extraerNumero(d.meta)
    const krs = []
    if (/video|youtube|tiktok|reels/.test(meta)) {
      krs.push(kr('Videos publicados', 'videos_published', numero || 12, 0, '', 'UP'))
      krs.push(kr('Suscriptores netos', 'net_subs', 1000, 0, '', 'UP'))
    } else if (/escrib|blog|post|newsletter|articulo|artículo/.test(meta)) {
      krs.push(kr('Piezas publicadas', 'pieces_published', numero || 24, 0, '', 'UP'))
      krs.push(kr('Suscriptores newsletter', 'newsletter_subs', 500, 0, '', 'UP'))
    } else if (/podcast|audio/.test(meta)) {
      krs.push(kr('Episodios publicados', 'episodes_published', numero || 12, 0, '', 'UP'))
      krs.push(kr('Descargas promedio', 'avg_downloads', 500, 0, '', 'UP'))
    } else {
      krs.push(kr('Piezas publicadas', 'pieces_published', numero || 12, 0, '', 'UP'))
      krs.push(kr('Audiencia neta sumada', 'net_audience', 1000, 0, '', 'UP'))
    }
    krs.push(kr('Sesiones de Deep Work / semana', 'deep_work_sessions', 4, 0, '', 'UP'))
    krs.push(kr('Consistencia de cadencia', 'cadence_consistency', 90, 0, '%', 'UP'))
    return krs
  },
  generarMisionesIniciales: () => [
    makeMission('Definir cadencia y formato', 'Una decisión: qué publico, dónde, con qué frecuencia. No cambies estos 3 ejes durante el trimestre.', 'CRITICA', 2, { storyPoints: 3 }),
    makeMission('Bloquear 2 ventanas de Deep Work', '90 min cada una. Mismo horario semanal. Sin notificaciones.', 'ALTA', 1, { storyPoints: 2 }),
    makeMission('Crear pipeline editorial', 'Backlog de ideas. Borrador. Editado. Publicado. Mantén 3 piezas en cada estado.', 'ALTA', 5, { storyPoints: 5 }),
    makeMission('Publicar la primera pieza esta semana', 'No tiene que ser perfecta. Tiene que existir y estar online.', 'CRITICA', 7, { storyPoints: 8 }),
  ],
}

const carreraPlaybook = {
  id: 'carrera-profesional',
  nombre: 'Carrera / Profesional',
  descripcion: 'Performance reviews trimestrales + networking estratégico + skill compounding. Tu carrera no es la suma de tareas, es la curva de habilidades + relaciones + visibilidad.',
  metodologia: 'OKR personal + Skill stacking (Adams) + Strategic networking (Ferrazzi) + Levels framework',
  ciclo: 'quincenal',
  vistaHUD: 'standard',
  ritualSemanal: { dia: 'viernes', hora: '17:00', tipo: 'review', duracionMin: 45 },
  consejosClave: [
    'Optimiza para que tu manager pueda defenderte. Outcomes visibles > horas trabajadas.',
    'Networking es composición. 1 conversación de calidad / semana en 1 año = 50 aliados estratégicos.',
    'Skill compound. Combina 2-3 habilidades raras que se refuerzan. Rara > excelente en una.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Subir de nivel profesional este periodo',
    descripcion: d.porQue || 'Construir el caso para el siguiente paso (promoción / cambio / aumento de scope).',
    periodo: defaultPeriodo(d.horizonteMeses || 6),
  }),
  generarKRs: () => [
    kr('Outcomes visibles documentados', 'visible_outcomes', 4, 0, '', 'UP'),
    kr('Skip-levels / mentor sessions', 'skip_level_mtgs', 6, 0, '', 'UP'),
    kr('Conversaciones de networking estratégico', 'strategic_chats', 12, 0, '', 'UP'),
    kr('Libros / cursos completados', 'learning_done', 3, 0, '', 'UP'),
  ],
  generarMisionesIniciales: () => [
    makeMission('Definir el "next level" objetivo', 'Concreto: rol + scope + criterio. Si no puedes nombrarlo, no puedes alcanzarlo.', 'CRITICA', 3, { storyPoints: 3 }),
    makeMission('Brag document arrancado', 'Doc vivo con outcomes, no actividades. Actualiza semanalmente. Esta es tu evidencia para review.', 'ALTA', 5, { storyPoints: 3 }),
    makeMission('Agendar 1 skip-level / coffee chat', 'Una conversación que no harías por inercia. Apunta alto, sé específico en la solicitud.', 'ALTA', 7, { storyPoints: 2 }),
    makeMission('Curar plan de aprendizaje del trimestre', '1 skill core + 1 skill raro complementario. Recursos identificados, calendario asignado.', 'NORMAL', 7, { storyPoints: 3 }),
  ],
}

const customPlaybook = {
  id: 'custom-okr',
  nombre: 'Custom (OKR estándar)',
  descripcion: 'OKR trimestral con sprints quincenales. Sirve cuando tu dominio no encaja en los presets.',
  metodologia: 'OKR (Doerr) + Scrum-lite',
  ciclo: 'quincenal',
  vistaHUD: 'standard',
  ritualSemanal: { dia: 'lunes', hora: '09:00', tipo: 'planning', duracionMin: 30 },
  consejosClave: [
    'Define 1 Objective ambicioso y 3 KRs medibles. Más Objectives diluyen el foco.',
    'Las misiones son los inputs, los KRs son los outputs. Si una misión no mueve un KR, cuestiónala.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Avanzar en la meta del trimestre',
    descripcion: d.porQue || '',
    periodo: defaultPeriodo(d.horizonteMeses || 3),
  }),
  generarKRs: () => [
    kr('KR 1', 'kr_1', 100, 0, '%', 'UP'),
    kr('KR 2', 'kr_2', 100, 0, '%', 'UP'),
    kr('KR 3', 'kr_3', 100, 0, '%', 'UP'),
  ],
  generarMisionesIniciales: () => [
    makeMission('Refinar tu Objective', 'Asegúrate de que sea ambicioso pero específico. Una frase clara.', 'CRITICA', 1, { storyPoints: 2 }),
    makeMission('Definir KRs medibles', 'Cada KR debe tener un número y una fecha. Sin eso es deseo, no KR.', 'ALTA', 2, { storyPoints: 3 }),
    makeMission('Listar 5 misiones iniciales', 'Las cosas concretas que harás esta semana para empezar a mover los KRs.', 'NORMAL', 3, { storyPoints: 2 }),
  ],
}

// ============================================================
// PLAYBOOK 8 — Padres / Crianza activa
// ============================================================
const padresPlaybook = {
  id: 'padres-crianza',
  nombre: 'Padres / Crianza activa',
  descripcion: 'Conexión antes que corrección. Rituales semanales de presencia + intencionalidad en momentos clave + autocuidado del cuidador como infraestructura.',
  metodologia: 'Authoritative parenting (Baumrind) + Conscious Parenting (Tsabary) + Repair > Perfection (Siegel)',
  ciclo: 'semanal',
  vistaHUD: 'multi-track',
  ritualSemanal: { dia: 'domingo', hora: '20:00', tipo: 'planning', duracionMin: 25 },
  consejosClave: [
    'Conexión antes que corrección. La regulación adulta es prerrequisito del aprendizaje infantil.',
    'Mantén un frente para cada hijo + un frente de pareja + un frente personal. Los 3 se sostienen mutuamente.',
    'Reparar > ser perfecto. La ruptura es inevitable; lo que define la relación es cómo vuelves.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Crianza intencional, presente y sostenible',
    descripcion: d.porQue || 'Crear las condiciones para que cada hijo crezca seguro, visto y autónomo.',
    periodo: defaultPeriodo(d.horizonteMeses || 3),
  }),
  generarKRs: () => [
    kr('Rituales 1-a-1 con cada hijo / semana', 'one_on_one_rituals', 3, 0, '', 'UP'),
    kr('Cena familiar sin pantallas', 'tech_free_dinners', 5, 0, '', 'UP'),
    kr('Conversaciones de pareja sin agenda logística', 'partner_talks', 2, 0, '', 'UP'),
    kr('Días de autocuidado personal', 'self_care_days', 3, 0, '', 'UP'),
  ],
  generarMisionesIniciales: () => [
    makeMission('Diseñar el ritual 1-a-1', 'Bloque semanal de 30 min con cada hijo. Actividad elegida por ellos. Sin agenda paterna.', 'CRITICA', 3, { storyPoints: 3 }),
    makeMission('Agendar cena familiar sin pantallas', 'Día y hora fijos. Todos los dispositivos en otra habitación. Una pregunta abierta para abrir.', 'ALTA', 2, { storyPoints: 2 }),
    makeMission('Conversación de pareja sin logística', '20 min, no se habla de horarios ni quehaceres. Conexión real. Mismo bloque semanal.', 'ALTA', 5, { storyPoints: 2 }),
    makeMission('Bloque de autocuidado personal', '1 hora a la semana 100% tuya. Sin culpa. Sin justificarlo.', 'NORMAL', 7, { storyPoints: 2 }),
  ],
}

// ============================================================
// PLAYBOOK 9 — Investigador / Tesis doctorado
// ============================================================
const investigadorPlaybook = {
  id: 'investigador-tesis',
  nombre: 'Investigador / Tesis',
  descripcion: 'Escritura diaria + lit review sistemático + pomodoros profundos. La tesis no se escribe en sprints heroicos, se construye en sesiones de 90 min sostenidas en el tiempo.',
  metodologia: 'Writing daily (Boice, "How Writers Journey to Comfort and Fluency") + Lit review sistemático (PRISMA) + Pomodoro profundo (Cirillo + Newport)',
  ciclo: 'semanal',
  vistaHUD: 'streak',
  ritualSemanal: { dia: 'viernes', hora: '17:00', tipo: 'review', duracionMin: 45 },
  consejosClave: [
    'Escribe primero, edita después. 250 palabras diarias > 5000 palabras un sábado al mes.',
    'Lit review no es leer, es mapear. Una matriz de autor × tema × tu hueco te ahorra meses.',
    'Tu director es un input, no el oráculo. Llega con propuestas, no con vacío.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Avanzar el capítulo / paper con disciplina diaria',
    descripcion: d.porQue || 'Salir del modo "voy a empezar mañana" y entrar en un ritmo de output incrementable.',
    periodo: defaultPeriodo(d.horizonteMeses || 6),
  }),
  generarKRs: (d) => {
    const numero = extraerNumero(d.meta)
    return [
      kr('Días con sesión de escritura', 'writing_days', 5, 0, '/sem', 'UP'),
      kr('Palabras escritas / semana', 'words_week', numero || 2500, 0, '', 'UP'),
      kr('Papers leídos y fichados', 'papers_logged', 4, 0, '/sem', 'UP'),
      kr('Reuniones con director / asesor', 'advisor_mtgs', 2, 0, '/mes', 'UP'),
    ]
  },
  generarMisionesIniciales: () => [
    makeMission('Bloquear sesión diaria de escritura', '90 min mismo horario cada día, antes del email. No-negociable.', 'CRITICA', 1, { storyPoints: 3 }),
    makeMission('Mapa de lit review en una hoja', 'Matriz: autor / contribución / hueco que abre. Si no entra en una hoja, no es un mapa, es un cementerio.', 'CRITICA', 3, { storyPoints: 5 }),
    makeMission('Definir el outline del capítulo actual', 'Una página. Secciones + tesis principal de cada una. Esto es tu mapa de carga.', 'ALTA', 5, { storyPoints: 3 }),
    makeMission('Agendar la siguiente reunión con director', 'Llega con un documento de 1 página: avances + preguntas concretas + decisiones que necesitas.', 'NORMAL', 7, { storyPoints: 2 }),
  ],
}

// ============================================================
// PLAYBOOK 10 — Diseñador / Output visual
// ============================================================
const disenadorPlaybook = {
  id: 'disenador-output',
  nombre: 'Diseñador / Output visual',
  descripcion: 'Process work + iteración con feedback + portfolio compuesto. El diseño se gana en el volumen de iteración, no en la pieza perfecta.',
  metodologia: 'Daily UI (Andersen) + Critique-driven iteration + Portfolio compounding',
  ciclo: 'semanal',
  vistaHUD: 'multi-track',
  ritualSemanal: { dia: 'viernes', hora: '17:00', tipo: 'review', duracionMin: 30 },
  consejosClave: [
    'Cantidad antes que calidad. 50 piezas malas te enseñan más que 1 perfecta.',
    'Publica el process work. La gente contrata a quien ve pensar, no solo a quien muestra el resultado.',
    'Pide critique semanal. 1 persona de mayor nivel + 1 par. Sin esos dos espejos, te ciegas.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Construir un portfolio que cuente cómo pienso, no solo qué produzco',
    descripcion: d.porQue || 'Convertir cada proyecto en evidencia compuesta de mi proceso.',
    periodo: defaultPeriodo(d.horizonteMeses || 3),
  }),
  generarKRs: () => [
    kr('Piezas publicadas / semana', 'pieces_week', 3, 0, '', 'UP'),
    kr('Iteraciones documentadas por pieza', 'iterations_per_piece', 5, 0, '', 'UP'),
    kr('Sesiones de critique recibidas', 'critique_sessions', 4, 0, '/mes', 'UP'),
    kr('Nuevos casos en portfolio', 'portfolio_cases', 4, 0, '', 'UP'),
  ],
  generarMisionesIniciales: () => [
    makeMission('Definir bracket de output semanal', 'Cuántas piezas, qué formato, qué plataforma. No cambies estos 3 ejes este mes.', 'CRITICA', 2, { storyPoints: 3 }),
    makeMission('Agendar critique recurrente', 'Bloque semanal con 1 mentor + 1 par. Reglas: foco en el porqué, no en el qué.', 'ALTA', 3, { storyPoints: 2 }),
    makeMission('Documentar el proceso de la primera pieza', 'Tres screenshots del proceso + 100 palabras de decisión. Eso es portfolio compuesto.', 'ALTA', 5, { storyPoints: 3 }),
    makeMission('Setup de archivo / case study template', 'Estructura: contexto / problema / iteraciones / decisión / aprendizaje. Reusable.', 'NORMAL', 7, { storyPoints: 3 }),
  ],
}

// ============================================================
// PLAYBOOK 11 — Idioma / Fluidez extranjera
// ============================================================
const idiomaPlaybook = {
  id: 'idioma-fluido',
  nombre: 'Idioma / Fluidez extranjera',
  descripcion: 'Input comprensible + output frecuente + inmersión bloqueada. Fluidez se gana en horas de input significativo, no en horas de gramática.',
  metodologia: 'Comprehensible Input (Krashen) + Spaced Repetition (Anki) + Production-based fluency (Lyster)',
  ciclo: 'semanal',
  vistaHUD: 'streak',
  ritualSemanal: { dia: 'domingo', hora: '19:00', tipo: 'planning', duracionMin: 25 },
  consejosClave: [
    'Input > gramática. 30 minutos de video subtitulado superan 1 hora de ejercicios.',
    'Habla mal y rápido. La fluidez precede a la corrección. Esperar a hablar perfecto = nunca hablar.',
    'Bloquea inmersión: una hora diaria total — música, podcasts, lecturas — del idioma objetivo.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Llegar a fluidez funcional en el idioma objetivo',
    descripcion: d.porQue || 'Comunicar ideas complejas sin que el idioma sea la barrera principal.',
    periodo: defaultPeriodo(d.horizonteMeses || 6),
  }),
  generarKRs: () => [
    kr('Días con input significativo', 'input_days', 6, 0, '/sem', 'UP'),
    kr('Minutos de input acumulados', 'input_minutes', 300, 0, 'min/sem', 'UP'),
    kr('Sesiones de output / output partner', 'output_sessions', 2, 0, '/sem', 'UP'),
    kr('Tarjetas Anki revisadas', 'anki_reviews', 200, 0, '/sem', 'UP'),
  ],
  generarMisionesIniciales: () => [
    makeMission('Elegir 3 fuentes de input', 'Una serie + un podcast + un creador. Nivel un poco arriba del actual. Comprometerte por 90 días.', 'CRITICA', 2, { storyPoints: 3 }),
    makeMission('Agendar output partner / italki', 'Mínimo 2 sesiones por semana. Mismo día, misma hora. No hay momento perfecto.', 'ALTA', 5, { storyPoints: 2 }),
    makeMission('Setup Anki personalizado', 'Deck propio con vocabulario de tus fuentes. No bajes decks ajenos.', 'ALTA', 3, { storyPoints: 3 }),
    makeMission('Bloque diario de inmersión pasiva', '30 min de música/podcast del idioma. Mientras caminas / cocinas / manejas. Conteo doble.', 'NORMAL', 1, { storyPoints: 1 }),
  ],
}

// ============================================================
// PLAYBOOK 12 — Pareja / Relación de largo plazo
// ============================================================
const parejaPlaybook = {
  id: 'pareja-relacion',
  nombre: 'Pareja / Relación',
  descripcion: 'Bid response + rituales de conexión + state-of-the-union semanal. La relación se construye en lo cotidiano, no en aniversarios.',
  metodologia: 'Gottman 4 Horsemen / Magic 5 Hours + Bid responses + State of the Union ritual',
  ciclo: 'semanal',
  vistaHUD: 'standard',
  ritualSemanal: { dia: 'domingo', hora: '17:00', tipo: 'review', duracionMin: 40 },
  consejosClave: [
    'Bid response es el predictor #1 de longevidad. Responder con presencia a los pequeños gestos.',
    'Ritual no es romance. Ritual es lo que sostiene la relación cuando el romance va y viene.',
    'State of the Union semanal: qué funcionó, qué dolió, qué necesitamos la próxima semana. 40 min, sin defensa.',
  ],
  generarObjective: (d) => ({
    titulo: d.meta || 'Construir una relación que se sostenga en lo cotidiano',
    descripcion: d.porQue || 'Convertir el "estamos bien" en evidencia, no en suposición.',
    periodo: defaultPeriodo(d.horizonteMeses || 3),
  }),
  generarKRs: () => [
    kr('State of the Union semanales', 'sotu_sessions', 4, 0, '/mes', 'UP'),
    kr('Rituales de conexión sin pantallas', 'connection_rituals', 6, 0, '/sem', 'UP'),
    kr('Apreciaciones verbalizadas', 'appreciations', 14, 0, '/sem', 'UP'),
    kr('Conflictos cerrados con reparación', 'repaired_conflicts_pct', 90, 0, '%', 'UP'),
  ],
  generarMisionesIniciales: () => [
    makeMission('Agendar State of the Union semanal', '40 min mismo día/hora. Tres preguntas: qué funcionó / qué dolió / qué necesito.', 'CRITICA', 3, { storyPoints: 3 }),
    makeMission('Definir 2 rituales de conexión', 'Ejemplos: café de la mañana sin teléfono, caminata después de cenar. Pequeños, repetibles.', 'ALTA', 2, { storyPoints: 2 }),
    makeMission('Práctica de bid response', 'Tres días esta semana: detecta un bid, responde con presencia. Anota qué pasó.', 'ALTA', 5, { storyPoints: 2 }),
    makeMission('Apreciación diaria explícita', 'Cada día, una cosa específica que valoraste de tu pareja. En voz alta, no asumida.', 'NORMAL', 1, { storyPoints: 1 }),
  ],
}


export const PLAYBOOKS = [
  founderPlaybook,
  habitosPlaybook,
  adminMultifacetedPlaybook,
  atletaPlaybook,
  estudiantePlaybook,
  creadorPlaybook,
  carreraPlaybook,
  padresPlaybook,
  investigadorPlaybook,
  disenadorPlaybook,
  idiomaPlaybook,
  parejaPlaybook,
  customPlaybook,
]

export const PLAYBOOK_BY_ID = Object.fromEntries(PLAYBOOKS.map(p => [p.id, p]))

function kr(titulo, metrica, target, current, unit, trend) {
  return { titulo, metrica, target, current, unit, trend }
}

function defaultPeriodo(meses) {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) + 1
  return `Q${q}-${now.getFullYear()} (${meses}m)`
}

function extraerNumero(texto) {
  if (!texto) return null
  const m = String(texto).match(/(\d[\d.,]*)/)
  if (!m) return null
  const n = parseFloat(m[1].replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export { slug, extraerNumero }
