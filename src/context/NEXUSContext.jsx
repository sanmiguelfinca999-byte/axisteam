import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import {
  CORONEL_CREDENTIALS,
  ACTIVOS_CREDENTIALS,
  SEED_TASKS,
  SEED_SPRINTS,
  SEED_OBJECTIVES,
  SEED_KEY_RESULTS,
  SCHEMA_VERSION,
  calcularSaludActivo,
  migrateMissionV3ToV4,
} from '../data/seedData'

const NEXUSContext = createContext(null)

export const useNEXUS = () => {
  const ctx = useContext(NEXUSContext)
  if (!ctx) throw new Error('useNEXUS must be used within NEXUSProvider')
  return ctx
}

// ============================================================
// Event factory para timeline
// ============================================================
const mkEvento = (tipo, autor, payload = {}) => ({
  id: `EV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  timestamp: new Date().toISOString(),
  tipo,
  autor,
  payload,
})

// ============================================================
// Mission Brief (SIR) generator — BriefAI
// ============================================================
const generateSIR = ({ tarea, activoOrigen, activoDestino, timestamp }) => {
  const id = `MB-${Date.now().toString(36).toUpperCase()}`
  return {
    id, timestamp,
    tarea: { ...tarea },
    activoOrigen: { id: activoOrigen.id, codename: activoOrigen.codename, nombre: activoOrigen.nombre },
    activoDestino: { id: activoDestino.id, codename: activoDestino.codename, nombre: activoDestino.nombre },
    instrucciones: [
      `TRANSFERENCIA INMEDIATA: La misión "${tarea.titulo}" ha sido re-ruteada de ${activoOrigen.codename} a ${activoDestino.codename}.`,
      `CONTEXTO: Progreso actual al momento del re-routing: ${tarea.progreso}%. Preservar avance.`,
      `PRIORIDAD: ${tarea.prioridad}. ${tarea.misionCritica ? 'CRITICAL MISSION — requiere atención inmediata.' : 'Gestionar según protocolos estándar.'}`,
      `ESPECIALIDAD REQUERIDA: ${activoDestino.especialidad} — compatibilidad confirmada por RouteAI.`,
      `TIEMPO LÍMITE: ${new Date(tarea.fechaLimite).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
      `ACCIÓN: ${activoDestino.codename} debe confirmar recepción y actualizar progreso en el siguiente ciclo de reporte.`,
    ],
    estado: 'ACTIVO', leido: false,
  }
}

// ============================================================
// RouteAI scoring (antes "Agente Estratega")
// ============================================================
const calcularScoreReasignacion = (activo, tarea, todasTareas) => {
  const tareasActivo = todasTareas.filter(t => t.activoId === activo.id && t.estado !== 'COMPLETADA')
  const saturacion = 100 - Math.min(100, tareasActivo.length * 25)
  const especialidad = activo.especialidad?.toLowerCase().includes(tarea?.descripcion?.toLowerCase().split(' ')[0] || '___') ? 20 : 0
  const disponibilidad = tareasActivo.filter(t => t.prioridad === 'CRITICA').length === 0 ? 30 : 0
  return saturacion + especialidad + disponibilidad
}

// ============================================================
// PROVIDER
// ============================================================
export function NEXUSProvider({ children }) {
  // ---- Persistent state ------------------------------------
  const [tasks, setTasks]                     = useLocalStorage('nexus_tasks', SEED_TASKS)
  const [sirs, setSirs]                       = useLocalStorage('nexus_sirs', [])
  const [historialReasig, setHistorialReasig] = useLocalStorage('nexus_hist', [])
  const [darkMode, setDarkMode]               = useLocalStorage('nexus_theme_dark', true)
  const [sprints, setSprints]                 = useLocalStorage('axis_sprints', SEED_SPRINTS)
  const [objectives, setObjectives]           = useLocalStorage('axis_objectives', SEED_OBJECTIVES)
  const [keyResults, setKeyResults]           = useLocalStorage('axis_key_results', SEED_KEY_RESULTS)
  const [schemaVersion, setSchemaVersion]     = useLocalStorage('axis_schema_version', SCHEMA_VERSION)

  // ---- Session/UI state ------------------------------------
  const [notificaciones, setNotificaciones]     = useState([])
  const [currentUser, setCurrentUser]           = useState(null)
  const [selectedActivoId, setSelectedActivoId] = useState(null)
  const [modalCrisis, setModalCrisis]           = useState(null)
  const [activeView, setActiveView]             = useState('hud')

  // ---- Migración soft v3 → v4 (solo al boot, idempotente) -
  useEffect(() => {
    if (schemaVersion === SCHEMA_VERSION) return
    setTasks(prev => prev.map(migrateMissionV3ToV4))
    if (!sprints || sprints.length === 0) setSprints(SEED_SPRINTS)
    if (!objectives || objectives.length === 0) setObjectives(SEED_OBJECTIVES)
    if (!keyResults || keyResults.length === 0) setKeyResults(SEED_KEY_RESULTS)
    setSchemaVersion(SCHEMA_VERSION)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Auth ------------------------------------------------
  const login = useCallback((username, password) => {
    if (username === CORONEL_CREDENTIALS.username && password === CORONEL_CREDENTIALS.password) {
      setCurrentUser({ ...CORONEL_CREDENTIALS })
      return { ok: true }
    }
    const activo = ACTIVOS_CREDENTIALS.find(a => a.username === username && a.password === password)
    if (activo) {
      setCurrentUser({ ...activo, role: 'ACTIVO' })
      return { ok: true }
    }
    return { ok: false, error: 'Credenciales inválidas' }
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setSelectedActivoId(null)
    setActiveView('hud')
  }, [])

  // ---- Notificaciones --------------------------------------
  const agregarNotificacion = useCallback((notif) => {
    const id = `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setNotificaciones(prev => [{ id, ...notif, leida: false }, ...prev].slice(0, 20))
    if (notif.tipo !== 'CRISIS') {
      setTimeout(() => setNotificaciones(prev => prev.filter(n => n.id !== id)), 5000)
    }
  }, [])

  const marcarNotifLeida = useCallback((id) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n))
  }, [])

  const marcarSirLeido = useCallback((sirId) => {
    setSirs(prev => prev.map(s => s.id === sirId ? { ...s, leido: true } : s))
  }, [setSirs])

  // ---- Mission CRUD (gestor) -------------------------------
  const crearMision = useCallback((data) => {
    const id = `T-${Date.now().toString(36).toUpperCase()}`
    const autor = currentUser?.codename || 'DIRECTOR'
    const evento = mkEvento('CREATED', autor, { titulo: data.titulo })
    const nueva = {
      id,
      activoId: data.activoId,
      titulo: data.titulo,
      descripcion: data.descripcion || '',
      prioridad: data.prioridad || 'NORMAL',
      estado: 'EN_PROGRESO',
      progreso: 0,
      fechaCreacion: new Date().toISOString(),
      fechaLimite: data.fechaLimite,
      misionCritica: data.prioridad === 'CRITICA',
      reasignada: false,
      sirId: null,
      sprintId: data.sprintId ?? null,
      keyResultId: data.keyResultId ?? null,
      bloqueaA: data.bloqueaA ?? [],
      bloqueadaPor: data.bloqueadaPor ?? [],
      storyPoints: data.storyPoints ?? null,
      eventos: [evento],
    }
    setTasks(prev => [...prev, nueva])
    agregarNotificacion({
      tipo: 'CREACION',
      mensaje: `Nueva misión: "${nueva.titulo}"`,
      timestamp: evento.timestamp,
    })
    return nueva
  }, [setTasks, currentUser, agregarNotificacion])

  const actualizarMision = useCallback((tareaId, patch) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== tareaId) return t
      const next = { ...t, ...patch }
      if (patch.prioridad) next.misionCritica = patch.prioridad === 'CRITICA'
      return next
    }))
  }, [setTasks])

  const eliminarMision = useCallback((tareaId) => {
    setTasks(prev => prev.filter(t => t.id !== tareaId))
  }, [setTasks])

  // ---- Mission ops -----------------------------------------
  const completarTarea = useCallback((tareaId) => {
    const autor = currentUser?.codename || 'SISTEMA'
    const evento = mkEvento('COMPLETED', autor, {})
    setTasks(prev => prev.map(t => t.id === tareaId
      ? { ...t, estado: 'COMPLETADA', progreso: 100, eventos: [...(t.eventos || []), evento] }
      : t))
  }, [setTasks, currentUser])

  const actualizarProgreso = useCallback((tareaId, progreso) => {
    const safe = Math.min(100, Math.max(0, progreso))
    setTasks(prev => prev.map(t => t.id === tareaId ? { ...t, progreso: safe } : t))
  }, [setTasks])

  const agregarComentario = useCallback((tareaId, texto) => {
    const clean = (texto || '').trim()
    if (!clean) return
    const autor = currentUser?.codename || currentUser?.nombre || 'ANÓNIMO'
    const evento = mkEvento('COMMENT', autor, { texto: clean })
    setTasks(prev => prev.map(t => t.id === tareaId
      ? { ...t, eventos: [...(t.eventos || []), evento] } : t))
  }, [setTasks, currentUser])

  // ---- Sprints --------------------------------------------
  const sprintActivo = useMemo(
    () => sprints.find(s => s.estado === 'ACTIVE') || null,
    [sprints]
  )

  const crearSprint = useCallback((nombre, goal, diasDuracion = 14) => {
    const id = `SP-${Date.now().toString(36).toUpperCase()}`
    const inicio = new Date()
    const fin = new Date(inicio.getTime() + diasDuracion * 86400000)
    const nuevo = {
      id, nombre, goal,
      fechaInicio: inicio.toISOString(),
      fechaFin: fin.toISOString(),
      estado: 'UPCOMING', retro: null,
    }
    setSprints(prev => [...prev, nuevo])
    return nuevo
  }, [setSprints])

  const cerrarSprint = useCallback((sprintId, retroData = {}) => {
    setSprints(prev => prev.map(s => s.id === sprintId
      ? { ...s, estado: 'COMPLETED', retro: { ...retroData, completadoEn: new Date().toISOString() } }
      : s))
  }, [setSprints])

  const vincularMisionASprint = useCallback((tareaId, sprintId) => {
    setTasks(prev => prev.map(t => t.id === tareaId ? { ...t, sprintId } : t))
  }, [setTasks])

  // ---- OKRs ------------------------------------------------
  const crearObjective = useCallback((titulo, descripcion, periodo, ownerId) => {
    const id = `OBJ-${Date.now().toString(36).toUpperCase()}`
    const nuevo = {
      id, titulo, descripcion, periodo, ownerId,
      estado: 'ACTIVE', fechaCreacion: new Date().toISOString(),
    }
    setObjectives(prev => [...prev, nuevo])
    return nuevo
  }, [setObjectives])

  const agregarKR = useCallback((objectiveId, titulo, metrica, target, unit = '%', trend = 'UP') => {
    const id = `KR-${Date.now().toString(36).toUpperCase()}`
    const nuevo = { id, objectiveId, titulo, metrica, target, current: 0, unit, trend }
    setKeyResults(prev => [...prev, nuevo])
    return nuevo
  }, [setKeyResults])

  const actualizarKR = useCallback((krId, current) => {
    setKeyResults(prev => prev.map(k => k.id === krId ? { ...k, current } : k))
  }, [setKeyResults])

  const vincularMisionAKR = useCallback((tareaId, krId) => {
    setTasks(prev => prev.map(t => t.id === tareaId ? { ...t, keyResultId: krId } : t))
  }, [setTasks])

  // % completitud por KR según misiones vinculadas (cuando no se actualiza manual)
  const krsWithProgress = useMemo(() => {
    return keyResults.map(kr => {
      const misiones = tasks.filter(t => t.keyResultId === kr.id)
      const completadas = misiones.filter(t => t.estado === 'COMPLETADA').length
      const total = misiones.length
      const progresoMisiones = total > 0 ? Math.round((completadas / total) * 100) : 0
      const progresoMetrica = kr.trend === 'UP'
        ? Math.min(100, Math.round((kr.current / kr.target) * 100))
        : Math.min(100, Math.round((kr.target / Math.max(kr.current, 0.0001)) * 100))
      return { ...kr, misiones: total, progresoMisiones, progresoMetrica }
    })
  }, [keyResults, tasks])

  // ---- Dependencies ---------------------------------------
  const agregarDependencia = useCallback((tareaABloqueaA, tareaBloqueada) => {
    setTasks(prev => prev.map(t => {
      if (t.id === tareaABloqueaA) {
        const nueva = [...(t.bloqueaA || [])]
        if (!nueva.includes(tareaBloqueada)) nueva.push(tareaBloqueada)
        return { ...t, bloqueaA: nueva }
      }
      if (t.id === tareaBloqueada) {
        const nueva = [...(t.bloqueadaPor || [])]
        if (!nueva.includes(tareaABloqueaA)) nueva.push(tareaABloqueaA)
        return { ...t, bloqueadaPor: nueva }
      }
      return t
    }))
  }, [setTasks])

  const quitarDependencia = useCallback((tareaABloqueaA, tareaBloqueada) => {
    setTasks(prev => prev.map(t => {
      if (t.id === tareaABloqueaA) return { ...t, bloqueaA: (t.bloqueaA || []).filter(x => x !== tareaBloqueada) }
      if (t.id === tareaBloqueada) return { ...t, bloqueadaPor: (t.bloqueadaPor || []).filter(x => x !== tareaABloqueaA) }
      return t
    }))
  }, [setTasks])

  // ---- Re-route Protocol (antes Protocolo Charlie) --------
  const ejecutarReasignacion = useCallback((tareaId, activoDestinoId) => {
    const tarea = tasks.find(t => t.id === tareaId)
    const activoOrigen = ACTIVOS_CREDENTIALS.find(a => a.id === tarea?.activoId)
    const activoDestino = ACTIVOS_CREDENTIALS.find(a => a.id === activoDestinoId)
    if (!tarea || !activoOrigen || !activoDestino) return

    const timestamp = new Date().toISOString()
    const sir = generateSIR({ tarea, activoOrigen, activoDestino, timestamp })
    const autor = currentUser?.codename || 'DIRECTOR'
    const evento = mkEvento('REASIGNADA', autor, {
      de: activoOrigen.codename, a: activoDestino.codename, sirId: sir.id,
    })

    setTasks(prev => prev.map(t => t.id === tareaId
      ? { ...t, activoId: activoDestinoId, reasignada: true, sirId: sir.id, eventos: [...(t.eventos || []), evento] }
      : t))
    setSirs(prev => [sir, ...prev])
    setHistorialReasig(prev => [{
      id: `RH-${Date.now()}`, timestamp, tareaId,
      tareaTitulo: tarea.titulo,
      activoOrigen: activoOrigen.codename, activoDestino: activoDestino.codename,
      sirId: sir.id,
    }, ...prev])

    agregarNotificacion({
      tipo: 'REASIGNACION',
      mensaje: `Re-route Protocol ejecutado. "${tarea.titulo}" → ${activoDestino.codename}. Mission Brief: ${sir.id}`,
      timestamp,
    })

    setModalCrisis(null)
  }, [tasks, setTasks, setSirs, setHistorialReasig, agregarNotificacion, currentUser])

  // ---- PulseAI: salud por Operator -------------------------
  const activosConSalud = useMemo(() => {
    return ACTIVOS_CREDENTIALS.map(activo => {
      const tareasActivo = tasks.filter(t => t.activoId === activo.id)
      const { salud, nivel, color, ...stats } = calcularSaludActivo(tareasActivo)
      const candidatos = ACTIVOS_CREDENTIALS
        .filter(a => a.id !== activo.id)
        .map(a => ({
          ...a,
          score: calcularScoreReasignacion(a, {}, tasks),
          tareas: tasks.filter(t => t.activoId === a.id && t.estado !== 'COMPLETADA').length,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

      // Capacity en sprint activo
      const tareasSprint = tareasActivo.filter(t => t.sprintId === sprintActivo?.id && t.estado !== 'COMPLETADA')
      const pointsSprint = tareasSprint.reduce((s, t) => s + (t.storyPoints || 0), 0)

      return {
        ...activo, salud, nivel, color, ...stats,
        tareas: tareasActivo,
        alertLevel: salud < 40 ? 'CHARLIE' : salud < 70 ? 'BRAVO' : 'NOMINAL',
        candidatosReasignacion: candidatos,
        tareasSprint: tareasSprint.length,
        pointsSprint,
      }
    })
  }, [tasks, sprintActivo])

  const detectarCrisis = useCallback(() => activosConSalud, [activosConSalud])

  const obtenerCandidatosParaTarea = useCallback((tarea, excluirActivoId = null) => {
    if (!tarea) return []
    return ACTIVOS_CREDENTIALS
      .filter(a => a.id !== (excluirActivoId ?? tarea.activoId))
      .map(a => ({
        ...a,
        score: calcularScoreReasignacion(a, tarea, tasks),
        tareas: tasks.filter(t => t.activoId === a.id && t.estado !== 'COMPLETADA').length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [tasks])

  const previewSIR = useCallback((tareaId, activoDestinoId) => {
    const tarea = tasks.find(t => t.id === tareaId)
    const activoOrigen = ACTIVOS_CREDENTIALS.find(a => a.id === tarea?.activoId)
    const activoDestino = ACTIVOS_CREDENTIALS.find(a => a.id === activoDestinoId)
    if (!tarea || !activoOrigen || !activoDestino) return null
    return generateSIR({ tarea, activoOrigen, activoDestino, timestamp: new Date().toISOString() })
  }, [tasks])

  const metricas = useMemo(() => {
    const totalTareas    = tasks.length
    const completadas    = tasks.filter(t => t.estado === 'COMPLETADA').length
    const enCrisis       = activosConSalud.filter(a => a.alertLevel === 'CHARLIE').length
    const enSobrecarga   = activosConSalud.filter(a => a.alertLevel === 'BRAVO').length
    const criticas       = tasks.filter(t => t.misionCritica && t.estado !== 'COMPLETADA').length
    const sirsPendientes = sirs.filter(s => !s.leido).length
    // Velocity del sprint activo
    const tareasSprint = sprintActivo ? tasks.filter(t => t.sprintId === sprintActivo.id) : []
    const pointsTotal = tareasSprint.reduce((s, t) => s + (t.storyPoints || 0), 0)
    const pointsCompletados = tareasSprint
      .filter(t => t.estado === 'COMPLETADA')
      .reduce((s, t) => s + (t.storyPoints || 0), 0)
    return {
      totalTareas, completadas, enCrisis, enSobrecarga, criticas, sirsPendientes,
      sprintPointsTotal: pointsTotal,
      sprintPointsCompletados: pointsCompletados,
      sprintProgreso: pointsTotal > 0 ? Math.round((pointsCompletados / pointsTotal) * 100) : 0,
    }
  }, [tasks, activosConSalud, sirs, sprintActivo])

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), [setDarkMode])

  const value = useMemo(() => ({
    // Auth
    currentUser,
    isCoronel: currentUser?.role === 'CORONEL',
    isDirector: currentUser?.role === 'CORONEL',  // alias semántico v4
    login, logout,
    // Data
    tasks, sirs, historialReasig, notificaciones, metricas, activosConSalud,
    sprints, sprintActivo, objectives, keyResults: krsWithProgress,
    // UI
    selectedActivoId, setSelectedActivoId,
    modalCrisis, setModalCrisis,
    activeView, setActiveView,
    darkMode, toggleDarkMode,
    // Mission actions
    completarTarea, actualizarProgreso, ejecutarReasignacion, agregarComentario,
    crearMision, actualizarMision, eliminarMision,
    agregarNotificacion, marcarNotifLeida, marcarSirLeido,
    // Sprint actions
    crearSprint, cerrarSprint, vincularMisionASprint,
    // OKR actions
    crearObjective, agregarKR, actualizarKR, vincularMisionAKR,
    // Dependencies
    agregarDependencia, quitarDependencia,
    // Agents
    detectarCrisis, obtenerCandidatosParaTarea, previewSIR, calcularSaludActivo,
    // Constants
    ACTIVOS_CREDENTIALS, CORONEL_CREDENTIALS,
  }), [
    currentUser, tasks, sirs, historialReasig, notificaciones, metricas, activosConSalud,
    sprints, sprintActivo, objectives, krsWithProgress,
    selectedActivoId, modalCrisis, activeView, darkMode,
    login, logout, toggleDarkMode,
    completarTarea, actualizarProgreso, ejecutarReasignacion, agregarComentario,
    crearMision, actualizarMision, eliminarMision,
    agregarNotificacion, marcarNotifLeida, marcarSirLeido,
    crearSprint, cerrarSprint, vincularMisionASprint,
    crearObjective, agregarKR, actualizarKR, vincularMisionAKR,
    agregarDependencia, quitarDependencia,
    detectarCrisis, obtenerCandidatosParaTarea, previewSIR,
  ])

  return <NEXUSContext.Provider value={value}>{children}</NEXUSContext.Provider>
}
