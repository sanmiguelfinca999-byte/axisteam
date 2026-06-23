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
import { MODE } from '../lib/dataSource'
import { supabase, fetchMyProfile } from '../lib/supabase'
import {
  missionFromDb, missionToDb,
  sprintFromDb,
  objectiveFromDb,
  krFromDb,
  operatorFromDb,
  eventFromDb,
} from '../lib/mappers'

const NEXUSContext = createContext(null)
export const useNEXUS = () => {
  const ctx = useContext(NEXUSContext)
  if (!ctx) throw new Error('useNEXUS must be used within NEXUSProvider')
  return ctx
}

const IS_CLOUD = MODE === 'supabase'

const mkEvento = (tipo, autor, payload = {}) => ({
  id: `EV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  timestamp: new Date().toISOString(),
  tipo, autor, payload,
})

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

const calcularScoreReasignacion = (activo, tarea, todasTareas) => {
  const tareasActivo = todasTareas.filter(t => t.activoId === activo.id && t.estado !== 'COMPLETADA')
  const saturacion = 100 - Math.min(100, tareasActivo.length * 25)
  const especialidad = activo.especialidad?.toLowerCase().includes(tarea?.descripcion?.toLowerCase().split(' ')[0] || '___') ? 20 : 0
  const disponibilidad = tareasActivo.filter(t => t.prioridad === 'CRITICA').length === 0 ? 30 : 0
  return saturacion + especialidad + disponibilidad
}

export function NEXUSProvider({ children }) {
  const [tasksLocal, setTasksLocal]                     = useLocalStorage('nexus_tasks', SEED_TASKS)
  const [sirsLocal, setSirsLocal]                       = useLocalStorage('nexus_sirs', [])
  const [historialLocal, setHistorialLocal]             = useLocalStorage('nexus_hist', [])
  const [sprintsLocal, setSprintsLocal]                 = useLocalStorage('axis_sprints', SEED_SPRINTS)
  const [objectivesLocal, setObjectivesLocal]           = useLocalStorage('axis_objectives', SEED_OBJECTIVES)
  const [keyResultsLocal, setKeyResultsLocal]           = useLocalStorage('axis_key_results', SEED_KEY_RESULTS)
  const [schemaVersion, setSchemaVersion]               = useLocalStorage('axis_schema_version', SCHEMA_VERSION)
  const [darkMode, setDarkMode]                         = useLocalStorage('nexus_theme_dark', true)
  const [userPlaybook, setUserPlaybook]                 = useLocalStorage('axis_user_playbook', null)
  const [axisMode, setAxisMode]                         = useLocalStorage('axis_mode', 'squad')
  const [reviewLog, setReviewLog]                       = useLocalStorage('axis_review_log', [])
  const [lastReviewAt, setLastReviewAt]                 = useLocalStorage('axis_last_review', null)

  const [tasksCloud, setTasksCloud]           = useState([])
  const [sprintsCloud, setSprintsCloud]       = useState([])
  const [objectivesCloud, setObjectivesCloud] = useState([])
  const [keyResultsCloud, setKeyResultsCloud] = useState([])
  const [operatorsCloud, setOperatorsCloud]   = useState([])
  const [eventsCloud, setEventsCloud]         = useState([])
  const [cloudLoaded, setCloudLoaded]         = useState(!IS_CLOUD)

  const tasksRaw    = IS_CLOUD ? tasksCloud       : tasksLocal
  const tasks       = useMemo(() => {
    if (!IS_CLOUD) return tasksRaw
    const byMission = {}
    for (const ev of eventsCloud) {
      if (!byMission[ev.missionId]) byMission[ev.missionId] = []
      byMission[ev.missionId].push(ev)
    }
    return tasksRaw.map(t => ({ ...t, eventos: byMission[t.id] || [] }))
  }, [tasksRaw, eventsCloud])

  const sprints     = IS_CLOUD ? sprintsCloud     : sprintsLocal
  const objectives  = IS_CLOUD ? objectivesCloud  : objectivesLocal
  const keyResults  = IS_CLOUD ? keyResultsCloud  : keyResultsLocal
  const sirs        = IS_CLOUD ? [] : sirsLocal
  const historialReasig = IS_CLOUD ? [] : historialLocal
  const setTasks      = IS_CLOUD ? setTasksCloud      : setTasksLocal
  const setSprints    = IS_CLOUD ? setSprintsCloud    : setSprintsLocal
  const setObjectives = IS_CLOUD ? setObjectivesCloud : setObjectivesLocal
  const setKeyResults = IS_CLOUD ? setKeyResultsCloud : setKeyResultsLocal
  const setSirs       = IS_CLOUD ? () => {} : setSirsLocal
  const setHistorialReasig = IS_CLOUD ? () => {} : setHistorialLocal

  const [notificaciones, setNotificaciones]     = useState([])
  const [currentUser, setCurrentUser]           = useState(null)
  const [selectedActivoId, setSelectedActivoId] = useState(null)
  const [modalCrisis, setModalCrisis]           = useState(null)
  const [activeView, setActiveView]             = useState('hud')

  useEffect(() => {
    if (IS_CLOUD) return
    if (schemaVersion === SCHEMA_VERSION) return
    setTasksLocal(prev => prev.map(migrateMissionV3ToV4))
    if (!sprintsLocal || sprintsLocal.length === 0) setSprintsLocal(SEED_SPRINTS)
    if (!objectivesLocal || objectivesLocal.length === 0) setObjectivesLocal(SEED_OBJECTIVES)
    if (!keyResultsLocal || keyResultsLocal.length === 0) setKeyResultsLocal(SEED_KEY_RESULTS)
    setSchemaVersion(SCHEMA_VERSION)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!IS_CLOUD) return
    let unsubs = []
    const boot = async () => {
      const profile = await fetchMyProfile()
      if (profile) setCurrentUser(operatorFromDb(profile))
      const [mRes, sRes, oRes, kRes, opRes, eRes] = await Promise.all([
        supabase.from('missions').select('*').order('fecha_creacion', { ascending: false }),
        supabase.from('sprints').select('*').order('fecha_inicio'),
        supabase.from('objectives').select('*'),
        supabase.from('key_results').select('*').order('posicion'),
        supabase.from('operators').select('*'),
        supabase.from('events').select('*').order('created_at', { ascending: true }),
      ])
      const ops = (opRes.data || []).map(operatorFromDb)
      setTasksCloud((mRes.data || []).map(missionFromDb))
      setSprintsCloud((sRes.data || []).map(sprintFromDb))
      setObjectivesCloud((oRes.data || []).map(objectiveFromDb))
      setKeyResultsCloud((kRes.data || []).map(krFromDb))
      setOperatorsCloud(ops)
      const opMap = Object.fromEntries(ops.map(o => [o.id, o.codename]))
      setEventsCloud((eRes.data || []).map(e => eventFromDb({ ...e, autor_codename: opMap[e.autor_id] })))
      setCloudLoaded(true)

      const channel = supabase
        .channel('axis:missions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, (payload) => {
          setTasksCloud(prev => {
            if (payload.eventType === 'DELETE') return prev.filter(t => t.id !== payload.old.id)
            const next = missionFromDb(payload.new)
            const i = prev.findIndex(t => t.id === next.id)
            if (i >= 0) { const copy = [...prev]; copy[i] = next; return copy }
            return [next, ...prev]
          })
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sprints' }, (payload) => {
          setSprintsCloud(prev => {
            if (payload.eventType === 'DELETE') return prev.filter(s => s.id !== payload.old.id)
            const next = sprintFromDb(payload.new)
            const i = prev.findIndex(s => s.id === next.id)
            if (i >= 0) { const copy = [...prev]; copy[i] = next; return copy }
            return [...prev, next]
          })
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'objectives' }, (payload) => {
          setObjectivesCloud(prev => {
            if (payload.eventType === 'DELETE') return prev.filter(o => o.id !== payload.old.id)
            const next = objectiveFromDb(payload.new)
            const i = prev.findIndex(o => o.id === next.id)
            if (i >= 0) { const copy = [...prev]; copy[i] = next; return copy }
            return [...prev, next]
          })
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'key_results' }, (payload) => {
          setKeyResultsCloud(prev => {
            if (payload.eventType === 'DELETE') return prev.filter(k => k.id !== payload.old.id)
            const next = krFromDb(payload.new)
            const i = prev.findIndex(k => k.id === next.id)
            if (i >= 0) { const copy = [...prev]; copy[i] = next; return copy }
            return [...prev, next]
          })
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
          setEventsCloud(prev => {
            const next = eventFromDb(payload.new)
            if (prev.find(e => e.id === next.id)) return prev
            return [...prev, next]
          })
        })
        .subscribe()
      unsubs.push(() => supabase.removeChannel(channel))

      const { data: authSub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (!session) setCurrentUser(null)
      })
      unsubs.push(() => authSub?.subscription?.unsubscribe())
    }
    boot().catch(err => {
      // eslint-disable-next-line no-console
      console.error('[AXIS::boot]', err)
      setCloudLoaded(true)
    })
    return () => { unsubs.forEach(fn => fn && fn()) }
  }, [])

  const login = useCallback(async (idOrEmail, password) => {
    if (IS_CLOUD) {
      const { data, error } = await supabase.auth.signInWithPassword({ email: idOrEmail, password })
      if (error) return { ok: false, error: error.message || 'Credenciales inválidas' }
      const profile = await fetchMyProfile()
      if (profile) setCurrentUser(operatorFromDb(profile))
      return { ok: true }
    }
    if (idOrEmail === CORONEL_CREDENTIALS.username && password === CORONEL_CREDENTIALS.password) {
      setCurrentUser({ ...CORONEL_CREDENTIALS })
      return { ok: true }
    }
    const activo = ACTIVOS_CREDENTIALS.find(a => a.username === idOrEmail && a.password === password)
    if (activo) {
      setCurrentUser({ ...activo, role: 'ACTIVO' })
      return { ok: true }
    }
    return { ok: false, error: 'Credenciales inválidas' }
  }, [])

  const logout = useCallback(async () => {
    if (IS_CLOUD) await supabase.auth.signOut().catch(() => {})
    setCurrentUser(null)
    setSelectedActivoId(null)
    setActiveView('hud')
  }, [])

  const agregarNotificacion = useCallback((notif) => {
    const id = `N-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setNotificaciones(prev => [{ id, ...notif, leida: false }, ...prev].slice(0, 20))
    if (notif.tipo !== 'CRISIS') {
      setTimeout(() => setNotificaciones(prev => prev.filter(n => n.id !== id)), 5000)
    }
  }, [])
  const marcarNotifLeida = useCallback((id) => setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n)), [])
  const marcarSirLeido   = useCallback((sirId) => setSirs(prev => prev.map(s => s.id === sirId ? { ...s, leido: true } : s)), [setSirs])

  const persistMission = useCallback(async (mission) => {
    if (IS_CLOUD) {
      const dbRow = missionToDb(mission)
      const { error } = await supabase.from('missions').upsert(dbRow)
      if (error) console.error('[AXIS::persistMission]', error)
      return
    }
    setTasks(prev => {
      const i = prev.findIndex(t => t.id === mission.id)
      if (i >= 0) { const copy = [...prev]; copy[i] = mission; return copy }
      return [...prev, mission]
    })
  }, [setTasks])

  const removeMission = useCallback(async (id) => {
    if (IS_CLOUD) {
      await supabase.from('missions').delete().eq('id', id).then(({error}) => error && console.error(error))
      return
    }
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [setTasks])

  const recordEvent = useCallback(async (missionId, tipo, payload = {}, autorOverride = null) => {
    const autor = autorOverride || currentUser?.codename || 'SISTEMA'
    const evento = mkEvento(tipo, autor, payload)
    if (IS_CLOUD) {
      const { error } = await supabase.from('events').insert({
        mission_id: missionId,
        tipo,
        autor_id: currentUser?.id || null,
        payload,
      })
      if (error) console.error('[AXIS::event]', error)
    }
    return evento
  }, [currentUser])

  const crearMision = useCallback(async (data) => {
    const id = `T-${Date.now().toString(36).toUpperCase()}`
    const evento = mkEvento('CREATED', currentUser?.codename || 'DIRECTOR', { titulo: data.titulo })
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
      reasignada: false, sirId: null,
      sprintId: data.sprintId ?? null,
      keyResultId: data.keyResultId ?? null,
      bloqueaA: data.bloqueaA ?? [],
      bloqueadaPor: data.bloqueadaPor ?? [],
      storyPoints: data.storyPoints ?? null,
      eventos: IS_CLOUD ? [] : [evento],
    }
    await persistMission(nueva)
    if (IS_CLOUD) await recordEvent(id, 'CREATED', { titulo: data.titulo })
    agregarNotificacion({ tipo: 'CREACION', mensaje: `Nueva misión: "${nueva.titulo}"`, timestamp: evento.timestamp })
    return nueva
  }, [persistMission, currentUser, agregarNotificacion, recordEvent])

  const actualizarMision = useCallback(async (tareaId, patch) => {
    const existing = tasks.find(t => t.id === tareaId)
    if (!existing) return
    const next = { ...existing, ...patch }
    if (patch.prioridad) next.misionCritica = patch.prioridad === 'CRITICA'
    await persistMission(next)
  }, [tasks, persistMission])

  const eliminarMision = useCallback(async (tareaId) => {
    await removeMission(tareaId)
  }, [removeMission])

  const completarTarea = useCallback(async (tareaId) => {
    const existing = tasks.find(t => t.id === tareaId)
    if (!existing) return
    // Idempotencia: si ya estaba completada, no re-persistir ni re-celebrar
    if (existing.estado === 'COMPLETADA') return
    const evento = mkEvento('COMPLETED', currentUser?.codename || 'SISTEMA', {})
    const next = { ...existing, estado: 'COMPLETADA', progreso: 100, eventos: IS_CLOUD ? existing.eventos : [...(existing.eventos || []), evento] }
    await persistMission(next)
    if (IS_CLOUD) await recordEvent(tareaId, 'COMPLETED', {})
    // Disparar celebración micro global (escuchado por MissionCelebration)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('axis:mission:completed', {
        detail: { tareaId, titulo: existing.titulo, prioridad: existing.prioridad },
      }))
    }
  }, [tasks, persistMission, currentUser, recordEvent])

  const actualizarProgreso = useCallback(async (tareaId, progreso) => {
    const existing = tasks.find(t => t.id === tareaId)
    if (!existing) return
    const safe = Math.min(100, Math.max(0, progreso))
    await persistMission({ ...existing, progreso: safe })
  }, [tasks, persistMission])

  const agregarComentario = useCallback(async (tareaId, texto) => {
    const clean = (texto || '').trim()
    if (!clean) return
    const existing = tasks.find(t => t.id === tareaId)
    if (!existing) return
    if (IS_CLOUD) {
      await recordEvent(tareaId, 'COMMENT', { texto: clean })
    } else {
      const autor = currentUser?.codename || currentUser?.nombre || 'ANÓNIMO'
      const evento = mkEvento('COMMENT', autor, { texto: clean })
      await persistMission({ ...existing, eventos: [...(existing.eventos || []), evento] })
    }
  }, [tasks, persistMission, currentUser, recordEvent])

  const sprintActivo = useMemo(() => sprints.find(s => s.estado === 'ACTIVE') || null, [sprints])

  const crearSprint = useCallback(async (nombre, goal, diasDuracion = 14) => {
    const id = `SP-${Date.now().toString(36).toUpperCase()}`
    const inicio = new Date()
    const fin = new Date(inicio.getTime() + diasDuracion * 86400000)
    const nuevo = { id, nombre, goal, fechaInicio: inicio.toISOString(), fechaFin: fin.toISOString(), estado: 'UPCOMING', retro: null }
    if (IS_CLOUD) {
      await supabase.from('sprints').upsert({
        id, nombre, goal, fecha_inicio: nuevo.fechaInicio, fecha_fin: nuevo.fechaFin, estado: 'UPCOMING', retro: null
      })
    } else {
      setSprints(prev => [...prev, nuevo])
    }
    return nuevo
  }, [setSprints])

  const cerrarSprint = useCallback(async (sprintId, retroData = {}) => {
    const retro = { ...retroData, completadoEn: new Date().toISOString() }
    if (IS_CLOUD) {
      await supabase.from('sprints').update({ estado: 'COMPLETED', retro }).eq('id', sprintId)
    } else {
      setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, estado: 'COMPLETED', retro } : s))
    }
  }, [setSprints])

  const vincularMisionASprint = useCallback(async (tareaId, sprintId) => {
    const existing = tasks.find(t => t.id === tareaId)
    if (!existing) return
    await persistMission({ ...existing, sprintId })
  }, [tasks, persistMission])

  const crearObjective = useCallback(async (titulo, descripcion, periodo, ownerId) => {
    const id = `OBJ-${Date.now().toString(36).toUpperCase()}`
    const nuevo = { id, titulo, descripcion, periodo, ownerId, estado: 'ACTIVE', fechaCreacion: new Date().toISOString() }
    if (IS_CLOUD) {
      await supabase.from('objectives').upsert({ id, titulo, descripcion, periodo, owner_id: ownerId, estado: 'ACTIVE' })
    } else {
      setObjectives(prev => [...prev, nuevo])
    }
    return nuevo
  }, [setObjectives])

  const agregarKR = useCallback(async (objectiveId, titulo, metrica, target, unit = '%', trend = 'UP') => {
    const id = `KR-${Date.now().toString(36).toUpperCase()}`
    const nuevo = { id, objectiveId, titulo, metrica, target, current: 0, unit, trend }
    if (IS_CLOUD) {
      await supabase.from('key_results').upsert({ id, objective_id: objectiveId, titulo, metrica, target, current: 0, unit, trend })
    } else {
      setKeyResults(prev => [...prev, nuevo])
    }
    return nuevo
  }, [setKeyResults])

  const actualizarKR = useCallback(async (krId, current) => {
    if (IS_CLOUD) {
      await supabase.from('key_results').update({ current }).eq('id', krId)
    } else {
      setKeyResults(prev => prev.map(k => k.id === krId ? { ...k, current } : k))
    }
  }, [setKeyResults])

  const vincularMisionAKR = useCallback(async (tareaId, krId) => {
    const existing = tasks.find(t => t.id === tareaId)
    if (!existing) return
    await persistMission({ ...existing, keyResultId: krId })
  }, [tasks, persistMission])

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

  const agregarDependencia = useCallback(async (a, b) => {
    const tA = tasks.find(t => t.id === a); const tB = tasks.find(t => t.id === b)
    if (!tA || !tB) return
    await persistMission({ ...tA, bloqueaA: [...(tA.bloqueaA || []), b].filter((v,i,arr)=>arr.indexOf(v)===i) })
    await persistMission({ ...tB, bloqueadaPor: [...(tB.bloqueadaPor || []), a].filter((v,i,arr)=>arr.indexOf(v)===i) })
  }, [tasks, persistMission])

  const quitarDependencia = useCallback(async (a, b) => {
    const tA = tasks.find(t => t.id === a); const tB = tasks.find(t => t.id === b)
    if (!tA || !tB) return
    await persistMission({ ...tA, bloqueaA: (tA.bloqueaA || []).filter(x => x !== b) })
    await persistMission({ ...tB, bloqueadaPor: (tB.bloqueadaPor || []).filter(x => x !== a) })
  }, [tasks, persistMission])

  const ejecutarReasignacion = useCallback(async (tareaId, activoDestinoId) => {
    const tarea = tasks.find(t => t.id === tareaId)
    const lista = IS_CLOUD ? operatorsCloud : ACTIVOS_CREDENTIALS
    const activoOrigen = lista.find(a => a.id === tarea?.activoId)
    const activoDestino = lista.find(a => a.id === activoDestinoId)
    if (!tarea || !activoOrigen || !activoDestino) return

    const timestamp = new Date().toISOString()
    const sir = generateSIR({ tarea, activoOrigen, activoDestino, timestamp })
    const evento = mkEvento('REASIGNADA', currentUser?.codename || 'DIRECTOR', { de: activoOrigen.codename, a: activoDestino.codename, sirId: sir.id })

    await persistMission({ ...tarea, activoId: activoDestinoId, reasignada: true, sirId: sir.id, eventos: IS_CLOUD ? (tarea.eventos || []) : [...(tarea.eventos || []), evento] })
    if (IS_CLOUD) await recordEvent(tarea.id, 'REASIGNADA', { de: activoOrigen.codename, a: activoDestino.codename, sirId: sir.id })

    if (!IS_CLOUD) {
      setSirs(prev => [sir, ...prev])
      setHistorialReasig(prev => [{
        id: `RH-${Date.now()}`, timestamp, tareaId,
        tareaTitulo: tarea.titulo,
        activoOrigen: activoOrigen.codename, activoDestino: activoDestino.codename,
        sirId: sir.id,
      }, ...prev])
    } else {
      await supabase.from('mission_briefs').upsert({
        id: sir.id,
        mission_id: tarea.id,
        origen_id: activoOrigen.id,
        destino_id: activoDestino.id,
        instrucciones: sir.instrucciones,
      })
    }

    agregarNotificacion({ tipo: 'REASIGNACION', mensaje: `Re-route Protocol: "${tarea.titulo}" → ${activoDestino.codename}. Brief: ${sir.id}`, timestamp })
    setModalCrisis(null)
  }, [tasks, operatorsCloud, persistMission, agregarNotificacion, currentUser, setSirs, setHistorialReasig])

  const ACTIVOS_LIST = IS_CLOUD ? operatorsCloud.filter(o => o.roleSemantic === 'OPERATOR') : ACTIVOS_CREDENTIALS

  const activosConSalud = useMemo(() => {
    return ACTIVOS_LIST.map(activo => {
      const tareasActivo = tasks.filter(t => t.activoId === activo.id)
      const { salud, nivel, color, ...stats } = calcularSaludActivo(tareasActivo)
      const candidatos = ACTIVOS_LIST
        .filter(a => a.id !== activo.id)
        .map(a => ({
          ...a,
          score: calcularScoreReasignacion(a, {}, tasks),
          tareas: tasks.filter(t => t.activoId === a.id && t.estado !== 'COMPLETADA').length,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
      const tareasSprint = tareasActivo.filter(t => t.sprintId === sprintActivo?.id && t.estado !== 'COMPLETADA')
      const pointsSprint = tareasSprint.reduce((s, t) => s + (t.storyPoints || 0), 0)
      return {
        ...activo, salud, nivel, color, ...stats,
        tareas: tareasActivo,
        alertLevel: salud < 40 ? 'CHARLIE' : salud < 70 ? 'BRAVO' : 'NOMINAL',
        candidatosReasignacion: candidatos,
        tareasSprint: tareasSprint.length, pointsSprint,
      }
    })
  }, [tasks, sprintActivo, ACTIVOS_LIST])

  const detectarCrisis = useCallback(() => activosConSalud, [activosConSalud])

  const obtenerCandidatosParaTarea = useCallback((tarea, excluirActivoId = null) => {
    if (!tarea) return []
    return ACTIVOS_LIST
      .filter(a => a.id !== (excluirActivoId ?? tarea.activoId))
      .map(a => ({
        ...a,
        score: calcularScoreReasignacion(a, tarea, tasks),
        tareas: tasks.filter(t => t.activoId === a.id && t.estado !== 'COMPLETADA').length,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [tasks, ACTIVOS_LIST])

  const previewSIR = useCallback((tareaId, activoDestinoId) => {
    const tarea = tasks.find(t => t.id === tareaId)
    const activoOrigen = ACTIVOS_LIST.find(a => a.id === tarea?.activoId)
    const activoDestino = ACTIVOS_LIST.find(a => a.id === activoDestinoId)
    if (!tarea || !activoOrigen || !activoDestino) return null
    return generateSIR({ tarea, activoOrigen, activoDestino, timestamp: new Date().toISOString() })
  }, [tasks, ACTIVOS_LIST])

  const metricas = useMemo(() => {
    const totalTareas    = tasks.length
    const completadas    = tasks.filter(t => t.estado === 'COMPLETADA').length
    const enCrisis       = activosConSalud.filter(a => a.alertLevel === 'CHARLIE').length
    const enSobrecarga   = activosConSalud.filter(a => a.alertLevel === 'BRAVO').length
    const criticas       = tasks.filter(t => t.misionCritica && t.estado !== 'COMPLETADA').length
    const sirsPendientes = sirs.filter(s => !s.leido).length
    const tareasSprint = sprintActivo ? tasks.filter(t => t.sprintId === sprintActivo.id) : []
    const pointsTotal = tareasSprint.reduce((s, t) => s + (t.storyPoints || 0), 0)
    const pointsCompletados = tareasSprint.filter(t => t.estado === 'COMPLETADA').reduce((s, t) => s + (t.storyPoints || 0), 0)
    return {
      totalTareas, completadas, enCrisis, enSobrecarga, criticas, sirsPendientes,
      sprintPointsTotal: pointsTotal,
      sprintPointsCompletados: pointsCompletados,
      sprintProgreso: pointsTotal > 0 ? Math.round((pointsCompletados / pointsTotal) * 100) : 0,
    }
  }, [tasks, activosConSalud, sirs, sprintActivo])

  const toggleDarkMode = useCallback(() => setDarkMode(d => !d), [setDarkMode])

  const applyPlaybook = useCallback(async (deployment, ownerIdParam = null) => {
    const { deploymentToEntities } = await import('../lib/playbookEngine')
    const ownerId = ownerIdParam || currentUser?.id || 'SOLO-USER'
    const sprintIdActivo = sprintActivo?.id || sprintsLocal[0]?.id || null
    const { objective, krs, misiones } = deploymentToEntities(deployment, ownerId, sprintIdActivo)

    if (IS_CLOUD) {
      await supabase.from('objectives').upsert({
        id: objective.id, titulo: objective.titulo, descripcion: objective.descripcion,
        periodo: objective.periodo, owner_id: objective.ownerId, estado: objective.estado,
      })
      for (const k of krs) {
        await supabase.from('key_results').upsert({
          id: k.id, objective_id: k.objectiveId, titulo: k.titulo, metrica: k.metrica,
          target: k.target, current: k.current, unit: k.unit, trend: k.trend, posicion: k.posicion,
        })
      }
      for (const m of misiones) {
        const { error } = await supabase.from('missions').upsert(missionToDb(m))
        if (error) console.error('[AXIS::applyPlaybook]', error)
      }
    } else {
      setObjectivesLocal([objective])
      setKeyResultsLocal(krs)
      setTasksLocal(misiones)
    }

    setUserPlaybook({
      ...deployment.playbook,
      diagnostico: deployment.meta?.diagnostico || null,
      deployedAt: new Date().toISOString(),
    })
    if (deployment.meta?.diagnostico?.modo) {
      setAxisMode(deployment.meta.diagnostico.modo)
    }

    agregarNotificacion({
      tipo: 'CREACION',
      mensaje: `Execution OS desplegado: ${deployment.playbook.nombre}`,
      timestamp: new Date().toISOString(),
    })
  }, [currentUser, sprintActivo, sprintsLocal, setObjectivesLocal, setKeyResultsLocal, setTasksLocal, setUserPlaybook, setAxisMode, agregarNotificacion])

  const resetPlaybook = useCallback(() => {
    setUserPlaybook(null)
  }, [setUserPlaybook])

  const needsOnboarding = !IS_CLOUD && !!currentUser && !userPlaybook

  const streakActual = useMemo(() => {
    if (!currentUser) return 0
    const scoped = axisMode === 'solo'
      ? tasks.filter(t => t.activoId === currentUser.id)
      : tasks
    if (scoped.length === 0) return 0
    const MS_DAY = 86_400_000
    const dayKey = (d) => {
      const x = new Date(d); x.setHours(0,0,0,0)
      return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`
    }
    const completions = new Set()
    for (const t of scoped) {
      const ev = (t.eventos || []).find(e => e.tipo === 'COMPLETED' || e.tipo === 'COMPLETADA')
      const d = ev?.timestamp ? new Date(ev.timestamp) : (t.estado === 'COMPLETADA' ? new Date(t.fechaLimite) : null)
      if (d && !Number.isNaN(d.getTime())) completions.add(dayKey(d))
    }
    if (completions.size === 0) return 0
    const today = new Date(); today.setHours(0,0,0,0)
    let count = 0
    for (let i = 0; i < 365; i++) {
      const probe = new Date(today.getTime() - i * MS_DAY)
      if (completions.has(dayKey(probe))) {
        count++
      } else {
        if (i === 0) continue
        break
      }
    }
    return count
  }, [tasks, currentUser, axisMode])


  // ---- Insights operativos (Inteligencia adaptativa) -------
  // Deriva señales accionables del estado actual:
  //   - sobrecarga: nivel basado en críticas activas
  //   - ritmo: ratio completadas vs creadas últimos 7 días
  //   - kr estancados: KRs sin avance suficiente en >14 días
  //   - misiones sin movimiento: activas sin eventos en >5 días
  //   - energía: derivado de streak + ratio completion
  const insights = useMemo(() => {
    if (!currentUser) return null
    const MS_DAY = 86_400_000
    const scoped = axisMode === 'solo'
      ? tasks.filter(t => t.activoId === currentUser.id)
      : tasks
    const now = Date.now()
    const weekAgo = now - 7 * MS_DAY

    const activas = scoped.filter(t => t.estado !== 'COMPLETADA')
    const criticasActivas = activas.filter(t => t.prioridad === 'CRITICA')
    const completadasSemana = scoped.filter(t => {
      if (t.estado !== 'COMPLETADA') return false
      const ev = (t.eventos || []).find(e => e.tipo === 'COMPLETED' || e.tipo === 'COMPLETADA')
      const ts = ev?.timestamp ? new Date(ev.timestamp).getTime() : new Date(t.fechaLimite).getTime()
      return ts >= weekAgo
    }).length
    const creadasSemana = scoped.filter(t => {
      const ts = new Date(t.fechaCreacion).getTime()
      return ts >= weekAgo
    }).length

    // Sobrecarga
    let sobrecarga = 'NOMINAL'
    if (criticasActivas.length >= 5) sobrecarga = 'ROJO'
    else if (criticasActivas.length >= 3) sobrecarga = 'AMARILLO'

    // KRs estancados — sin progreso significativo y objetivo creado hace >14 días
    const krStancados = (keyResults || []).filter(k => {
      if (!k.fechaCreacion) {
        // Heurística por progresoMetrica: <25% pero objective antiguo
        const obj = (objectives || []).find(o => o.id === k.objectiveId)
        if (!obj) return false
        const dias = (now - new Date(obj.fechaCreacion).getTime()) / MS_DAY
        return dias > 14 && (k.progresoMetrica ?? 0) < 25
      }
      const dias = (now - new Date(k.fechaCreacion).getTime()) / MS_DAY
      return dias > 14 && (k.progresoMetrica ?? 0) < 25
    })

    // Misiones sin movimiento (activas sin eventos en >5 días)
    const sinMovimiento = activas.filter(t => {
      const eventos = (t.eventos || []).slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      const ref = eventos[0]?.timestamp || t.fechaCreacion
      return ((now - new Date(ref).getTime()) / MS_DAY) >= 5
    })

    // Ritmo: ratio completadas / creadas
    const ratio = creadasSemana > 0 ? completadasSemana / creadasSemana : (completadasSemana > 0 ? 1.5 : 0)
    let ritmo = 'PLANO'
    if (ratio >= 1) ritmo = 'ACELERANDO'
    else if (ratio >= 0.5) ritmo = 'SOSTENIDO'
    else if (creadasSemana > 0) ritmo = 'DESACELERANDO'

    // Nivel de energía (cualitativo) — combinación de streak + ratio
    let energia = 'BAJO'
    if (streakActual >= 7 && ratio >= 0.6) energia = 'ALTO'
    else if (streakActual >= 3 || ratio >= 0.5) energia = 'MEDIO'

    return {
      sobrecarga,                    // NOMINAL | AMARILLO | ROJO
      criticasActivas: criticasActivas.length,
      activasTotal: activas.length,
      completadasSemana,
      creadasSemana,
      ratioCompletadasCreadas: Math.round(ratio * 100) / 100,
      ritmo,                          // ACELERANDO | SOSTENIDO | PLANO | DESACELERANDO
      energia,                        // ALTO | MEDIO | BAJO
      krEstancados: krStancados.map(k => ({ id: k.id, titulo: k.titulo, pct: k.progresoMetrica ?? 0 })),
      sinMovimiento: sinMovimiento.slice(0, 5).map(t => ({
        id: t.id,
        titulo: t.titulo,
        prioridad: t.prioridad,
        diasSinTocar: Math.floor((now - new Date(((t.eventos || [])[0]?.timestamp) || t.fechaCreacion).getTime()) / MS_DAY),
      })),
    }
  }, [tasks, currentUser, axisMode, keyResults, objectives, streakActual])

  const registerWeeklyReview = useCallback((entry) => {
    const record = {
      id: `REV-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString(),
      ...entry,
    }
    setReviewLog(log => [record, ...(log || [])].slice(0, 200))
    setLastReviewAt(record.date)
    agregarNotificacion({
      tipo: 'CREACION',
      mensaje: 'Weekly Review registrada',
      timestamp: record.date,
    })
    return record
  }, [setReviewLog, setLastReviewAt, agregarNotificacion])

  const exportSnapshot = useCallback(() => {
    return {
      version: 'axis-snapshot/v1',
      exportedAt: new Date().toISOString(),
      mode: MODE,
      data: {
        tasks: tasksLocal,
        sirs: sirsLocal,
        historial: historialLocal,
        sprints: sprintsLocal,
        objectives: objectivesLocal,
        keyResults: keyResultsLocal,
        userPlaybook,
        axisMode,
        reviewLog,
        lastReviewAt,
        schemaVersion,
        darkMode,
      },
    }
  }, [tasksLocal, sirsLocal, historialLocal, sprintsLocal, objectivesLocal, keyResultsLocal, userPlaybook, axisMode, reviewLog, lastReviewAt, schemaVersion, darkMode])

  const importSnapshot = useCallback((snapshot) => {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.data) {
      throw new Error('Snapshot inválido: falta el campo "data".')
    }
    const d = snapshot.data
    if (Array.isArray(d.tasks))       setTasksLocal(d.tasks)
    if (Array.isArray(d.sirs))        setSirsLocal(d.sirs)
    if (Array.isArray(d.historial))   setHistorialLocal(d.historial)
    if (Array.isArray(d.sprints))     setSprintsLocal(d.sprints)
    if (Array.isArray(d.objectives))  setObjectivesLocal(d.objectives)
    if (Array.isArray(d.keyResults))  setKeyResultsLocal(d.keyResults)
    if (Array.isArray(d.reviewLog))   setReviewLog(d.reviewLog)
    if (d.userPlaybook !== undefined) setUserPlaybook(d.userPlaybook)
    if (typeof d.axisMode === 'string') setAxisMode(d.axisMode)
    if (typeof d.lastReviewAt === 'string' || d.lastReviewAt === null) setLastReviewAt(d.lastReviewAt)
    if (typeof d.darkMode === 'boolean') setDarkMode(d.darkMode)
    if (typeof d.schemaVersion === 'string') setSchemaVersion(d.schemaVersion)
    agregarNotificacion({
      tipo: 'CREACION',
      mensaje: 'Snapshot importado correctamente',
      timestamp: new Date().toISOString(),
    })
  }, [setTasksLocal, setSirsLocal, setHistorialLocal, setSprintsLocal, setObjectivesLocal, setKeyResultsLocal, setReviewLog, setUserPlaybook, setAxisMode, setLastReviewAt, setDarkMode, setSchemaVersion, agregarNotificacion])

  const resetAll = useCallback(() => {
    const keys = [
      'nexus_tasks', 'nexus_sirs', 'nexus_hist',
      'axis_sprints', 'axis_objectives', 'axis_key_results',
      'axis_schema_version', 'axis_user_playbook', 'axis_mode',
      'axis_review_log', 'axis_last_review',
    ]
    try {
      for (const k of keys) window.localStorage.removeItem(k)
    } catch (err) {
      console.error('[AXIS::resetAll]', err)
    }
  }, [])

  const value = useMemo(() => ({
    currentUser,
    isCoronel: currentUser?.role === 'CORONEL',
    isDirector: currentUser?.role === 'CORONEL',
    mode: MODE,
    cloudLoaded,
    login, logout,
    tasks, sirs, historialReasig, notificaciones, metricas, activosConSalud,
    sprints, sprintActivo, objectives, keyResults: krsWithProgress,
    selectedActivoId, setSelectedActivoId,
    modalCrisis, setModalCrisis,
    activeView, setActiveView,
    darkMode, toggleDarkMode,
    completarTarea, actualizarProgreso, ejecutarReasignacion, agregarComentario,
    crearMision, actualizarMision, eliminarMision,
    agregarNotificacion, marcarNotifLeida, marcarSirLeido,
    crearSprint, cerrarSprint, vincularMisionASprint,
    crearObjective, agregarKR, actualizarKR, vincularMisionAKR,
    agregarDependencia, quitarDependencia,
    detectarCrisis, obtenerCandidatosParaTarea, previewSIR, calcularSaludActivo,
    ACTIVOS_CREDENTIALS: ACTIVOS_LIST, CORONEL_CREDENTIALS,
    userPlaybook, axisMode, setAxisMode, applyPlaybook, resetPlaybook, needsOnboarding,
    streakActual, insights,
    reviewLog, lastReviewAt, registerWeeklyReview,
    exportSnapshot, importSnapshot, resetAll,
  }), [
    currentUser, cloudLoaded, tasks, sirs, historialReasig, notificaciones, metricas, activosConSalud,
    sprints, sprintActivo, objectives, krsWithProgress, selectedActivoId, modalCrisis, activeView, darkMode,
    login, logout, toggleDarkMode,
    completarTarea, actualizarProgreso, ejecutarReasignacion, agregarComentario,
    crearMision, actualizarMision, eliminarMision,
    agregarNotificacion, marcarNotifLeida, marcarSirLeido,
    crearSprint, cerrarSprint, vincularMisionASprint,
    crearObjective, agregarKR, actualizarKR, vincularMisionAKR,
    agregarDependencia, quitarDependencia,
    streakActual, insights, reviewLog, lastReviewAt, registerWeeklyReview,
    exportSnapshot, importSnapshot, resetAll,
    detectarCrisis, obtenerCandidatosParaTarea, previewSIR,
    ACTIVOS_LIST,
    userPlaybook, axisMode, applyPlaybook, resetPlaybook, needsOnboarding,
  ])

  if (IS_CLOUD && !cloudLoaded) {
    return (
      <div className="min-h-screen bg-nexus-bg flex items-center justify-center">
        <div className="text-nexus-muted font-mono text-sm flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          AXIS · Conectando al Execution OS...
        </div>
      </div>
    )
  }

  return <NEXUSContext.Provider value={value}>{children}</NEXUSContext.Provider>
}
