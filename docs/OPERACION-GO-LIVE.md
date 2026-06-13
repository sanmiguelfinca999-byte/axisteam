# AXIS — Operación Go-Live

Secuencia compacta para pasar de localStorage a producción multi-usuario.
**Tiempo estimado total: 30-40 minutos.**

---

## Paso 1 — Push código a GitHub (2 min)

Abre **Git Bash** y ejecuta:

```bash
cd "C:/Users/capor/OneDrive/Documentos/Claude/Projects/NEXUS"
git init 2>/dev/null
git add -A
git commit -m "feat: AXIS v4.1 — Execution OS Foundation"
git branch -M main
git remote remove origin 2>/dev/null
git remote add origin https://github.com/sanmiguelfinca999-byte/axisteam.git
git push -u origin main
```

Si pide credenciales: usa **Personal Access Token** con scope `repo` (Settings → Developer settings → Tokens classic).

**Confirmar:** ve a `https://github.com/sanmiguelfinca999-byte/axisteam` y verifica que ves los archivos.

---

## Paso 2 — Crear proyecto Supabase (5 min)

1. https://supabase.com/dashboard → **New project**
2. **Name:** `axis-execution-os`
3. **Database Password:** **genera una fuerte y guárdala en password manager**. La vas a necesitar en Vercel y para SQL clients
4. **Region:** `East US (North Virginia)` — `us-east-1`
5. **Pricing Plan:** Free
6. **Create new project** — espera 2 minutos a que provisione

**Confirmar:** entras al Dashboard del proyecto y ves "Project is ready".

---

## Paso 3 — Ejecutar SQL (3 min)

En el proyecto Supabase recién creado:

1. Sidebar izquierdo → **SQL Editor** → **+ New query**
2. Abre `supabase/schema.sql` desde tu PC, copia TODO su contenido, pega en el editor, **Run** (botón abajo a la derecha)
3. Nueva query: pega TODO el contenido de `supabase/rls.sql` → **Run**
4. Nueva query: pega TODO el contenido de `supabase/seed.sql` → **Run**

**Confirmar:** Sidebar → **Database** → **Tables** y verifica que ves: `operators`, `sprints`, `objectives`, `key_results`, `missions`, `events`, `mission_briefs`, `notifications`.

---

## Paso 4 — Crear cuentas (5 min)

### Opción A: Script Node (recomendado, más rápido)

1. Supabase Dashboard → **Project Settings** → **API** → copia **service_role** key (la marca como secret)
2. Copia también la **Project URL**
3. En Git Bash, desde la raíz del proyecto:

```bash
npm install  # si aún no instalaste deps
SUPABASE_URL="https://tu-proyecto.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="eyJ...la_service_role_completa" \
node supabase/setup-accounts.mjs
```

Deberías ver 5 ticks verdes. Te dará las credenciales para login.

### Opción B: Manual desde Dashboard

Para cada cuenta:
1. Dashboard → **Authentication → Users → Add user**
2. **Email + password** según la lista de abajo
3. ✅ marca **Auto Confirm User**
4. **User Metadata**: pega el JSON correspondiente
5. **Add user**

| # | Email | Password | Metadata |
|---|---|---|---|
| 1 | `director@axis.demo` | `AxisDirector2026!` | `{"codename":"DIRECTOR","nombre":"Hannah","role":"DIRECTOR","especialidad":"Command & Strategy","avatar":"🎯"}` |
| 2 | `phantom@axis.demo` | `AxisOperator2026!` | `{"codename":"PHANTOM","nombre":"Operator 01","role":"OPERATOR","especialidad":"Inteligencia de Datos","avatar":"🕵️"}` |
| 3 | `cipher@axis.demo` | `AxisOperator2026!` | `{"codename":"CIPHER","nombre":"Operator 02","role":"OPERATOR","especialidad":"Operaciones de Campo","avatar":"⚡"}` |
| 4 | `nova@axis.demo` | `AxisOperator2026!` | `{"codename":"NOVA","nombre":"Operator 03","role":"OPERATOR","especialidad":"Comunicaciones Tácticas","avatar":"📡"}` |
| 5 | `wraith@axis.demo` | `AxisOperator2026!` | `{"codename":"WRAITH","nombre":"Operator 04","role":"OPERATOR","especialidad":"Análisis de Amenazas","avatar":"🔍"}` |

**Confirmar:** Authentication → Users muestra los 5. SQL Editor: `select id, codename, role from operators` debe devolver las 5 rows.

---

## Paso 5 — Deploy a Vercel (10 min)

1. https://vercel.com → **Add New → Project**
2. **Import Git Repository** → encuentra `sanmiguelfinca999-byte/axisteam` → **Import**
3. **Framework Preset:** Vite (auto-detectado)
4. Expande **Environment Variables** y agrega:
   - `VITE_SUPABASE_URL` = `https://tu-proyecto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = la **anon public** key (NO la service_role) del Supabase Project Settings → API
5. **Deploy.** Tarda 1-2 minutos
6. Copia la URL de Vercel (ej. `https://axisteam-xyz.vercel.app`)
7. **Vuelve a Supabase Dashboard → Authentication → URL Configuration:**
   - **Site URL:** pega la URL de Vercel
   - **Redirect URLs:** agrega `https://axisteam-xyz.vercel.app/**` (con doble asterisco al final)

**Confirmar:** abre la URL de Vercel, ves la pantalla de login de AXIS.

---

## Paso 6 — Smoke test (3 min)

1. **Brave normal:** login con `director@axis.demo` / `AxisDirector2026!`
2. **Brave ventana incógnita** (o Chrome): login con `phantom@axis.demo` / `AxisOperator2026!`
3. Desde Director: presiona `N`, crea misión "Test sync" asignada a PHANTOM, prioridad ALTA, guarda
4. En Brave incógnito: el Operator PHANTOM debe ver la misión aparecer **en vivo** (sin refrescar)

Si esto funciona: **AXIS está en producción multi-usuario.**

---

## Troubleshooting rápido

| Síntoma | Fix |
|---|---|
| Vercel build falla con error de `@supabase/supabase-js` | Verifica que `package.json` ya tiene la dependencia y `package-lock.json` está commiteado |
| Login en producción dice "Invalid login credentials" | Verifica que los users tienen ✅ Auto-confirmed en Supabase Dashboard |
| Operator ve TODAS las misiones (no solo las suyas) | RLS no aplicada. Re-corre `rls.sql` completo |
| "row violates row-level security policy" al crear misión | El usuario logueado no tiene `role = 'DIRECTOR'` en `operators`. Fix: `update operators set role='DIRECTOR' where codename='DIRECTOR'` en SQL Editor |
| Misión creada por Director no aparece en pantalla del Operator | Realtime no habilitado. Verifica al final de `schema.sql`: `alter publication supabase_realtime add table public.missions` ejecutó OK |

---

## Después del Go-Live

Cuando el smoke test pase, el siguiente sprint es la **migración del provider**: cambiar `useLocalStorage` por suscripciones realtime en cada entidad. Eso ya queda bajo mi responsabilidad y se hace sin tocar tu instancia Supabase.

Yo me encargo del Provider Migration una vez que confirmes que el smoke test pasó.
