// ============================================================
// AXIS — Bulk creation de cuentas
// Ejecuta: node supabase/setup-accounts.mjs
//
// Requiere variables de entorno:
//   SUPABASE_URL=https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... (NO la anon — la service_role)
//
// La service_role key la encuentras en:
//   Supabase Dashboard → Project Settings → API → service_role (secret)
// NUNCA la committees ni la expongas al cliente. Es solo para este script local.
// ============================================================

import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL
const SR  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!URL || !SR) {
  console.error('Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  console.error('Uso:')
  console.error('  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=eyJ... node supabase/setup-accounts.mjs')
  process.exit(1)
}

const supabase = createClient(URL, SR, { auth: { autoRefreshToken: false, persistSession: false } })

// ============================================================
// Cuentas a crear (Director + 4 Operators con placeholders)
// Passwords seguros pero memorables. Cámbialos después del primer login.
// ============================================================
// ============================================================
// Equipo real — Hannah + 2 Operators usando +alias de Gmail
// Los 3 emails llegan al mismo inbox: sanmiguelfinca999@gmail.com
// Esto permite validar las 3 vistas (Director + Operator A + Operator B)
// sin involucrar todavia a los colaboradores reales.
// Cuando los Operators reales esten listos, actualizar email en
// Supabase Dashboard → Authentication → Users.
// ============================================================
const ACCOUNTS = [
  {
    email: 'sanmiguelfinca999@gmail.com',
    password: 'AxisLead2026!',
    metadata: {
      username: 'lead',
      codename: 'LEAD',
      nombre:   'Hannah',
      role:     'DIRECTOR',
      especialidad: 'Coordinacion',
      avatar: '◆',
    },
  },
  {
    email: 'sanmiguelfinca999+opA@gmail.com',
    password: 'AxisOpA2026!',
    metadata: {
      username: 'phantom',
      codename: 'PHANTOM',
      nombre:   'Operator A',
      role:     'OPERATOR',
      especialidad: 'Por definir',
      avatar: '🕵️',
    },
  },
  {
    email: 'sanmiguelfinca999+opB@gmail.com',
    password: 'AxisOpB2026!',
    metadata: {
      username: 'nova',
      codename: 'NOVA',
      nombre:   'Operator B',
      role:     'OPERATOR',
      especialidad: 'Por definir',
      avatar: '📡',
    },
  },
]

// ============================================================
const run = async () => {
  console.log(`\nCreando ${ACCOUNTS.length} cuentas en Supabase...\n`)
  let ok = 0
  let fail = 0
  for (const a of ACCOUNTS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email:         a.email,
      password:      a.password,
      email_confirm: true,
      user_metadata: a.metadata,
    })
    if (error) {
      console.error(`  ✗ ${a.email.padEnd(30)} ${error.message}`)
      fail++
    } else {
      console.log(`  ✓ ${a.email.padEnd(30)} ${a.metadata.role} ${a.metadata.codename}`)
      ok++
    }
  }
  console.log(`\nResultado: ${ok} creados, ${fail} fallaron.\n`)
  console.log('Credenciales (cambialas en primer login):')
  console.log(`  Director  Hannah  : sanmiguelfinca999@gmail.com       / AxisLead2026!`)
  console.log(`  Operator  A       : sanmiguelfinca999+opA@gmail.com   / AxisOpA2026!`)
  console.log(`  Operator  B       : sanmiguelfinca999+opB@gmail.com   / AxisOpB2026!`)
  console.log(`\nNota: los 3 correos llegan al mismo inbox.\n`)
}

run().catch(e => { console.error(e); process.exit(1) })
