# AXIS — Setup Supabase + Vercel

Guía paso a paso para llevar AXIS de localStorage a producción multi-usuario.

**Tiempo estimado:** 30-45 minutos de Hannah + 1-2 días de migración del provider (lo hago yo).

---

## Fase 0 — Pre-requisitos

- Cuenta GitHub (gratis)
- Cuenta Supabase (gratis): https://supabase.com
- Cuenta Vercel (gratis): https://vercel.com
- Repo del proyecto pusheado a GitHub

---

## Fase 1 — Crear el proyecto Supabase (10 min)

1. Entra a https://supabase.com/dashboard → **New project**
2. Datos del proyecto:
   - **Name:** `axis-execution-os`
   - **Database Password:** genera una segura y guárdala en password manager (la necesitarás si conectas SQL clients)
   - **Region:** la más cercana a tu equipo (ej. `us-east-1` para México)
   - **Pricing Plan:** **Free** (cubre 500 MB DB + 50K MAU; sobra para 11 Operators)
3. Espera ~2 minutos a que provisione

---

## Fase 2 — Correr SQL (5 min)

Una vez listo el proyecto:

1. Dashboard → **SQL Editor** → **New query**
2. Pega el contenido completo de `supabase/schema.sql` → **Run**
   - Si todo OK verás "Success. No rows returned"
3. Nueva query: pega `supabase/rls.sql` → **Run**
4. Nueva query: pega `supabase/seed.sql` → **Run**

Verifica en **Database → Tables** que aparecen:
`operators`, `sprints`, `objectives`, `key_results`, `missions`, `events`, `mission_briefs`, `notifications`.

---

## Fase 3 — Configurar Auth (5 min)

1. Dashboard → **Authentication → Providers**
2. **Email** debe estar habilitado (lo está por defecto)
3. Dashboard → **Authentication → URL Configuration**
   - **Site URL:** `http://localhost:5173` (después la cambias a tu dominio Vercel)
   - **Redirect URLs:** agrega `http://localhost:5173/**` y tu dominio futuro
4. Opcional pero recomendado: **Authentication → Email Templates** — personaliza el correo de invitación

---

## Fase 4 — Crear cuentas de los Operators (10 min)

Tienes 3 opciones:

### A. Via Dashboard (más simple para empezar)

1. Dashboard → **Authentication → Users → Add user**
2. Email + password temporal
3. Marca **Auto Confirm User** (skip verificación email para setup)
4. En **User Metadata** (raw_user_meta_data) pega:
   ```json
   {
     "codename": "PHANTOM",
     "nombre": "Sofía Vega",
     "role": "OPERATOR",
     "especialidad": "Inteligencia de Datos",
     "avatar": "🕵️"
   }
   ```
5. **Add user.** El trigger `handle_new_user()` crea el perfil en `operators` automáticamente.
6. Repite para los 11 Operators + 1 Director (role: "DIRECTOR")

### B. Via invite link (más profesional)

1. **Authentication → Users → Invite user**
2. Manda email; el Operator define su propia password al aceptar

### C. Via SQL bulk (más rápido)

Crea un script `bulk-users.sql` (te lo armo si quieres) que ejecuta `auth.admin.createUser()` para los 11. Requiere Service Role Key (no expongas en cliente).

---

## Fase 5 — Obtener credenciales para el cliente (2 min)

1. Dashboard → **Project Settings → API**
2. Copia:
   - **Project URL** → será tu `VITE_SUPABASE_URL`
   - **anon public key** (la corta, NO la service_role) → será tu `VITE_SUPABASE_ANON_KEY`

> La `service_role key` NUNCA va al cliente. Solo úsala para scripts admin local.

---

## Fase 6 — Configurar el cliente local (3 min)

En la raíz del proyecto:

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```
VITE_SUPABASE_URL=https://xyzabc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Instala la dependencia (solo la primera vez):

```bash
npm install
```

Arranca el dev server:

```bash
npm run dev
```

Abre la consola del navegador. Debes ver `[AXIS] dataSource MODE = supabase`. Si ves `MODE = local`, las env vars no se cargaron correctamente.

> **Importante:** después de cambiar `.env.local` siempre reinicia `npm run dev`.

---

## Fase 7 — Deploy a Vercel (10 min)

1. Push del proyecto a GitHub si aún no
2. Vercel Dashboard → **Add New → Project**
3. Importa el repo de GitHub
4. **Framework Preset:** Vite (auto-detectado)
5. **Environment Variables:** agrega las dos del paso 5
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. **Deploy.** Tarda ~1-2 minutos
7. Una vez deploy listo, copia la URL de Vercel y vuelve a Supabase:
   - Dashboard → **Authentication → URL Configuration**
   - **Site URL:** la URL de Vercel (ej. `https://axis-xyz.vercel.app`)
   - **Redirect URLs:** agrega `https://axis-xyz.vercel.app/**`

---

## Fase 8 — Smoke test multi-usuario (5 min)

1. Abre la URL de Vercel en 2 navegadores diferentes (o uno normal + uno incógnito)
2. Login como Director en el primero
3. Login como Operator en el segundo
4. Crea una misión desde el Director
5. El Operator debe verla aparecer en tiempo real en su Focus Mode

Si esto funciona: **AXIS está en producción multi-usuario.**

---

## Troubleshooting

| Síntoma | Causa | Fix |
|---|---|---|
| `MODE = local` en consola | Env vars no cargadas | Reinicia `npm run dev`; verifica que `.env.local` está en la raíz, no en subdirectorio |
| Login falla con "Invalid login credentials" | Cuenta no creada o auto-confirm desmarcado | Dashboard → Users → confirma el usuario manualmente |
| Operator ve TODAS las misiones | RLS no habilitado o policies mal | Revisa que corriste `rls.sql` completo; en SQL Editor: `select * from pg_policies where tablename = 'missions'` debe devolver 4 rows |
| "row violates row-level security policy" al crear misión | El usuario no tiene role DIRECTOR | Dashboard → Users → edita user metadata, role = "DIRECTOR", o `update operators set role='DIRECTOR' where id='<uuid>'` |
| Realtime no actualiza | Tablas no en publicación realtime | Revisa al final de `schema.sql` — debe correr el `alter publication supabase_realtime add table ...` |

---

## Costos esperados

| Servicio | Plan | Costo | Límites |
|---|---|---|---|
| Supabase | Free | $0/mes | 500 MB DB, 50K MAU, 2 GB bandwidth |
| Vercel | Hobby | $0/mes | 100 GB bandwidth, builds ilimitadas |
| **Total** | | **$0/mes** | Cubre 11 Operators fácilmente |

Si crece el equipo a 50+ usuarios o el tráfico sube significativamente, upgrade a Supabase Pro ($25/mes) cubre todo lo razonable.

---

## Siguiente: migración del provider

Cuando confirmes que el setup funciona, yo arranco la migración de:
- `useLocalStorage(...)` → `useSupabaseTable(...)` con realtime
- `login()` mock → `supabase.auth.signInWithPassword()`
- LoginScreen actualizado con registro/reset password
- Script de migración: tu localStorage actual → bulk insert en Supabase

Plazo: 1-2 días después de que confirmes que Fases 1-7 están listas.
