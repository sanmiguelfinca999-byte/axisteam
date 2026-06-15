// ============================================================
// Mappers — Supabase (snake_case) ↔ cliente AXIS (camelCase)
// ============================================================

// ---- Mission ------------------------------------------------
export const missionFromDb = (m) => {
  if (!m) return null
  return {
    id:             m.id,
    activoId:       m.operator_id,
    titulo:         m.titulo,
    descripcion:    m.descripcion,
    prioridad:      m.prioridad,
    estado:         m.estado,
    progreso:       m.progreso,
    storyPoints:    m.story_points,
    fechaCreacion:  m.fecha_creacion,
    fechaLimite:    m.fecha_limite,
    misionCritica:  m.mision_critica,
    reasignada:     m.reasignada,
    sirId:          m.sir_id,
    sprintId:       m.sprint_id,
    keyResultId:    m.key_result_id,
    bloqueaA:       m.bloquea_a || [],
    bloqueadaPor:   m.bloqueada_por || [],
    eventos:        [], // se hidrata aparte vía events table
  }
}

export const missionToDb = (m) => {
  if (!m) return null
  return {
    id:              m.id,
    operator_id:     m.activoId,
    titulo:          m.titulo,
    descripcion:     m.descripcion,
    prioridad:       m.prioridad,
    estado:          m.estado,
    progreso:        m.progreso,
    story_points:    m.storyPoints,
    fecha_creacion:  m.fechaCreacion,
    fecha_limite:    m.fechaLimite,
    mision_critica:  m.misionCritica,
    reasignada:      m.reasignada,
    sir_id:          m.sirId,
    sprint_id:       m.sprintId,
    key_result_id:   m.keyResultId,
    bloquea_a:       m.bloqueaA,
    bloqueada_por:   m.bloqueadaPor,
  }
}

// ---- Sprint -------------------------------------------------
export const sprintFromDb = (s) => {
  if (!s) return null
  return {
    id:           s.id,
    nombre:       s.nombre,
    goal:         s.goal,
    fechaInicio:  s.fecha_inicio,
    fechaFin:     s.fecha_fin,
    estado:       s.estado,
    retro:        s.retro,
  }
}

export const sprintToDb = (s) => ({
  id:            s.id,
  nombre:        s.nombre,
  goal:          s.goal,
  fecha_inicio:  s.fechaInicio,
  fecha_fin:     s.fechaFin,
  estado:        s.estado,
  retro:         s.retro,
})

// ---- Objective ----------------------------------------------
export const objectiveFromDb = (o) => {
  if (!o) return null
  return {
    id:            o.id,
    titulo:        o.titulo,
    descripcion:   o.descripcion,
    periodo:       o.periodo,
    ownerId:       o.owner_id,
    estado:        o.estado,
    fechaCreacion: o.created_at,
  }
}

export const objectiveToDb = (o) => ({
  id:          o.id,
  titulo:      o.titulo,
  descripcion: o.descripcion,
  periodo:     o.periodo,
  owner_id:    o.ownerId,
  estado:      o.estado,
})

// ---- KeyResult ----------------------------------------------
export const krFromDb = (k) => {
  if (!k) return null
  return {
    id:          k.id,
    objectiveId: k.objective_id,
    titulo:      k.titulo,
    metrica:     k.metrica,
    target:      Number(k.target),
    current:     Number(k.current),
    unit:        k.unit,
    trend:       k.trend,
    posicion:    k.posicion,
  }
}

export const krToDb = (k) => ({
  id:           k.id,
  objective_id: k.objectiveId,
  titulo:       k.titulo,
  metrica:      k.metrica,
  target:       k.target,
  current:      k.current,
  unit:         k.unit,
  trend:        k.trend,
  posicion:     k.posicion,
})

// ---- Operator (profile) ------------------------------------
export const operatorFromDb = (o) => {
  if (!o) return null
  return {
    id:           o.id,
    username:     o.username,
    codename:     o.codename,
    nombre:       o.nombre,
    especialidad: o.especialidad,
    avatar:       o.avatar,
    role:         o.role === 'DIRECTOR' ? 'CORONEL' : 'ACTIVO', // back-compat con check existente
    roleSemantic: o.role,                                       // semántico v4
  }
}

// ---- Event (timeline) ---------------------------------------
export const eventFromDb = (e) => {
  if (!e) return null
  return {
    id:        e.id,
    missionId: e.mission_id,
    tipo:      e.tipo,
    autor:     e.autor_codename || e.autor_id,
    autorId:   e.autor_id,
    payload:   e.payload || {},
    timestamp: e.created_at,
  }
}

export const eventToDb = (e, missionId) => ({
  mission_id: missionId,
  tipo:       e.tipo,
  autor_id:   e.autorId,
  payload:    e.payload,
})

// ---- Mission Brief (SIR) ------------------------------------
export const briefFromDb = (b) => {
  if (!b) return null
  return {
    id:            b.id,
    timestamp:     b.created_at,
    tarea:         { titulo: '', progreso: 0, prioridad: 'NORMAL', misionCritica: false, fechaLimite: null, ...((b.payload && b.payload.tarea) || {}) },
    activoOrigen:  { id: b.origen_id,  codename: b.origen_codename || '',  nombre: '' },
    activoDestino: { id: b.destino_id, codename: b.destino_codename || '', nombre: '' },
    instrucciones: b.instrucciones || [],
    estado:        'ACTIVO',
    leido:         (b.leido_por || []).length > 0,
  }
}
