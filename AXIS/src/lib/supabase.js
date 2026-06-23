// ============================================================
// Cliente Supabase — AXIS v4
// Lee credenciales de import.meta.env (Vite)
// Si faltan, exporta null y la app usa fallback localStorage
// ============================================================
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

let _client = null

export const supabase = (() => {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    if (typeof console !== 'undefined') {
      // eslint-disable-next-line no-console
      console.info('[AXIS] Supabase no configurado. Operando en modo localStorage.')
    }
    return null
  }
  if (_client) return _client
  _client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  })
  return _client
})()

export const isSupabaseEnabled = !!supabase

// ============================================================
// Helper: detectar si una respuesta es error de RLS
// ============================================================
export const isRLSError = (error) => {
  if (!error) return false
  return error.code === '42501' || /row.level security/i.test(error.message || '')
}

// ============================================================
// Helper: chequear sesión actual
// ============================================================
export const getSession = async () => {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[AXIS::auth] getSession error', error)
    return null
  }
  return data?.session ?? null
}

// ============================================================
// Helper: perfil completo (operators row) del usuario actual
// ============================================================
export const fetchMyProfile = async () => {
  if (!supabase) return null
  const session = await getSession()
  if (!session) return null
  const { data, error } = await supabase
    .from('operators')
    .select('*')
    .eq('id', session.user.id)
    .single()
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[AXIS::profile]', error)
    return null
  }
  return data
}
