// ============================================================
// AXIS — Edge Function: invite-operator
// Solo Director puede invocar. Crea cuenta en auth.users + perfil
// vía trigger handle_new_user, e invita al email del nuevo Operator.
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY') ?? ''

  if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
    return json({ error: 'Server misconfigured: faltan env vars' }, 500)
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'Authorization header requerido' }, 401)
    }

    // Cliente con sesión del caller para verificar identidad y role
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: userResp, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userResp?.user) {
      return json({ error: 'Sesión inválida' }, 401)
    }
    const user = userResp.user

    const { data: profile, error: profErr } = await userClient
      .from('operators')
      .select('role, codename')
      .eq('id', user.id)
      .single()

    if (profErr || !profile) {
      return json({ error: 'Perfil no encontrado' }, 403)
    }
    if (profile.role !== 'DIRECTOR') {
      return json({ error: 'Solo el Director puede invitar Operators' }, 403)
    }

    // Parsear payload
    const payload = await req.json().catch(() => null)
    if (!payload) return json({ error: 'JSON body inválido' }, 400)

    const { email, codename, nombre, especialidad, avatar, role = 'OPERATOR' } = payload
    if (!email || !codename || !nombre) {
      return json({ error: 'Faltan campos requeridos: email, codename, nombre' }, 400)
    }
    if (!['OPERATOR', 'DIRECTOR'].includes(role)) {
      return json({ error: 'Role inválido' }, 400)
    }

    // Cliente admin con service_role
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const usernameSafe = String(codename).toLowerCase().replace(/[^a-z0-9_-]/g, '')

    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        username: usernameSafe,
        codename: String(codename).toUpperCase().slice(0, 30),
        nombre: String(nombre).slice(0, 120),
        role,
        especialidad: especialidad ? String(especialidad).slice(0, 120) : null,
        avatar: avatar ? String(avatar).slice(0, 8) : null,
        invited_by: profile.codename,
      },
    })

    if (inviteErr) {
      return json({ error: inviteErr.message }, 400)
    }

    return json({
      ok: true,
      user: {
        id: inviteData.user?.id,
        email: inviteData.user?.email,
        codename: String(codename).toUpperCase(),
      },
    }, 200)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    return json({ error: msg }, 500)
  }
})
