// ============================================================
// dataSource — abstracción que decide entre Supabase y localStorage
// según VITE_SUPABASE_URL esté definida o no
//
// Esto permite:
//  - Demos locales offline sin tocar el backend
//  - Migración progresiva del provider sin big-bang
//  - Rollback inmediato si Supabase tiene problemas
// ============================================================
import { isSupabaseEnabled, supabase } from './supabase'

export const MODE = isSupabaseEnabled ? 'supabase' : 'local'

// ============================================================
// API genérica de CRUD que el provider usará
// Cada entidad tiene { list, get, create, update, remove }
// Implementación local trabaja contra localStorage
// Implementación supabase delega al cliente JS
// ============================================================
const LS_KEYS = {
  missions:        'nexus_tasks',
  sprints:         'axis_sprints',
  objectives:      'axis_objectives',
  key_results:     'axis_key_results',
  mission_briefs:  'nexus_sirs',
  reassign_log:    'nexus_hist',
}

// ---- LOCAL implementation -------------------------------------
const localAdapter = {
  list:   (table) => safeRead(table, []),
  upsert: (table, row) => {
    const all = safeRead(table, [])
    const i = all.findIndex(r => r.id === row.id)
    if (i >= 0) all[i] = { ...all[i], ...row }
    else        all.push(row)
    safeWrite(table, all)
    return row
  },
  remove: (table, id) => {
    const all = safeRead(table, [])
    safeWrite(table, all.filter(r => r.id !== id))
  },
}

function safeRead(table, fallback) {
  try {
    const key = LS_KEYS[table] || `axis_${table}`
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeWrite(table, value) {
  try {
    const key = LS_KEYS[table] || `axis_${table}`
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[AXIS::dataSource] write fail', table, e)
  }
}

// ---- SUPABASE implementation ----------------------------------
const supabaseAdapter = {
  list: async (table) => {
    if (!supabase) return []
    const { data, error } = await supabase.from(table).select('*')
    if (error) {
      // eslint-disable-next-line no-console
      console.error(`[AXIS::supabase] list ${table}`, error)
      return []
    }
    return data || []
  },
  upsert: async (table, row) => {
    if (!supabase) return row
    const { data, error } = await supabase.from(table).upsert(row).select().single()
    if (error) {
      // eslint-disable-next-line no-console
      console.error(`[AXIS::supabase] upsert ${table}`, error)
      throw error
    }
    return data
  },
  remove: async (table, id) => {
    if (!supabase) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) {
      // eslint-disable-next-line no-console
      console.error(`[AXIS::supabase] delete ${table}`, error)
      throw error
    }
  },
  subscribe: (table, onChange) => {
    if (!supabase) return () => {}
    const channel = supabase
      .channel(`axis:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
        onChange(payload)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  },
}

// ============================================================
// Export: la abstracción activa según modo
// ============================================================
export const ds = MODE === 'supabase' ? supabaseAdapter : localAdapter

// Subscribe es no-op en modo local (cambios son síncronos en mismo cliente)
if (!ds.subscribe) ds.subscribe = () => () => {}

// ============================================================
// Banner de diagnóstico para DevTools
// ============================================================
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.info(`[AXIS] dataSource MODE = ${MODE}`)
}
