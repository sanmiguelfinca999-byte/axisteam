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
const ACCOUNTS = [
  {
    email: 'director@axis.demo',
    password: 'AxisDirector2026!',
    metadata: {
      username: 'director',
      codename: 'DIRECTOR',
      nombre:   'Hannah',
      role:     'DIRECTOR',
      especialidad: 'Command & Strategy',
      avatar: '🎯',
    },
  },
  {
    email: 'phantom@axis.demo',
    password: 'AxisOperator2026!',
    metadata: {
      username: 'phantom',
      codename: 'PHANTOM',
      nombre:   'Operator 01',
      role:     'OPERATOR',
      especialidad: 'Inteligencia de Datos',
      avatar: '🕵️',
    },
  },
  {
    email: 'cipher@axis.demo',
    password: 'AxisOperator2026!',
    metadata: {
      username: 'cipher',
      codename: 'CIPHER',
      nombre:   'Operator 02',
      role:     'OPERATOR',
      especialidad: 'Operaciones de Campo',
      avatar: '⚡',
    },
  },
  {
    email: 'nova@axis.demo',
    password: 'AxisOperator2026!',
    metadata: {
      username: 'nova',
      codename: 'NOVA',
      nombre:   'Operator 03',
      role:     'OPERATOR',
      especialidad: 'Comunicaciones Tácticas',
      avatar: '📡',
    },
  },
  {
    email: 'wraith@axis.demo',
    password: 'AxisOperator2026!',
    metadata: {
      username: 'wraith',
      codename: 'WRAITH',
      nombre:   'Operator 04',
      role:     'OPERATOR',
      especialidad: 'Análisis de Amenazas',
      avatar: '🔍',
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
  console.log('Credenciales (cámbialas en primer login):')
  console.log(`  Director: director@axis.demo / AxisDirector2026!`)
  console.log(`  Operators: phantom|cipher|nova|wraith @ axis.demo / AxisOperator2026!\n`)
}

run().catch(e => { console.error(e); process.exit(1) })
