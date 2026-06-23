# ADR-003: Backend Supabase + Hosting Vercel

- **Estado:** Aprobado — Foundation entregada, migración del provider en curso
- **Fecha:** 2026-06-13
- **Decisores:** Hannah (Product Owner)
- **Versión afectada:** 4.0.0 → 4.1.0

## Contexto

AXIS v4 funciona en localStorage, lo cual era apropiado para el MVP de demostración pero impide el uso multi-usuario real. Cargar 11 Operators implica:
1. Cada uno con sesión real con email/password (no credenciales hardcodeadas)
2. Estado compartido en tiempo real entre Director y Operators
3. RBAC enforced server-side (no solo en render del cliente)
4. Persistencia durable, backups, auditoría

## Decisión

**Backend: Supabase.** **Hosting frontend: Vercel.**

### Por qué Supabase (sobre alternativas)

| Opción | Pro | Contra | Veredicto |
|---|---|---|---|
| **Supabase** | Postgres + Auth + Realtime + Storage + RLS server-side; free tier 500MB/50K MAU; cliente JS oficial; SDK realtime out-of-the-box | Vendor lock-in moderado, RLS curva de aprendizaje | **Aceptado** |
| Firebase | Maduro, ecosistema grande | NoSQL limita queries relacionales (Sprint↔Mission↔KR); reglas más complejas; menor portabilidad | Descartado |
| Backend propio (Express + Postgres + Redis + WS) | Control total | 3-5× más esfuerzo, sin ROI vs. Supabase para esta escala | Descartado |
| PlanetScale / Neon + auth aparte (Clerk/Auth.js) | Stack desacoplado | Requiere armar auth, realtime y storage separados | Descartado |

### Por qué Vercel (sobre alternativas)

| Opción | Pro | Contra | Veredicto |
|---|---|---|---|
| **Vercel** | Estándar de facto 2026 para Vite + React; previews por PR; analytics; edge functions; integración Supabase nativa | Tier Hobby tiene límites de bandwidth (suficientes) | **Aceptado** |
| Netlify | Funciona bien, `netlify.toml` ya committeado | Marginalmente peor DX para este stack | Alternativa válida |
| Cloudflare Pages | Edge runtime potente | Menos integraciones con Supabase | Alternativa futura |

## Schema de datos

```
operators        ← perfiles (extiende auth.users de Supabase)
  ├─ id (uuid, FK auth.users)
  ├─ codename, nombre, especialidad, avatar
  └─ role: 'DIRECTOR' | 'OPERATOR'

sprints          ← ciclos temporales
  ├─ id, nombre, goal
  ├─ fecha_inicio, fecha_fin
  ├─ estado: 'UPCOMING'|'ACTIVE'|'COMPLETED'
  └─ retro (jsonb)

objectives       ← OKR layer
  ├─ id, titulo, descripcion, periodo
  ├─ owner_id (FK operators)
  └─ estado

key_results
  ├─ id, objective_id (FK)
  ├─ titulo, metrica, target, current, unit, trend
  └─ posición (orden)

missions         ← unidad de trabajo
  ├─ id, titulo, descripcion
  ├─ operator_id (FK)
  ├─ sprint_id (FK, nullable)
  ├─ key_result_id (FK, nullable)
  ├─ prioridad, estado, progreso, story_points
  ├─ fecha_limite, fecha_creacion
  ├─ reasignada, sir_id
  └─ bloqueada_por[], bloquea_a[]  (arrays de mission ids)

events           ← timeline + comments por misión
  ├─ id, mission_id (FK)
  ├─ tipo: 'CREATED'|'REASIGNADA'|'COMPLETED'|'COMMENT'|'PROGRESO'
  ├─ autor_id (FK operators)
  ├─ payload (jsonb)
  └─ created_at

mission_briefs   ← Mission Briefs (legacy SIR)
  ├─ id, mission_id
  ├─ origen_id, destino_id (FK operators)
  ├─ instrucciones (jsonb)
  ├─ leido_por (jsonb)
  └─ created_at

notifications    ← bandeja por usuario
  ├─ id, user_id
  ├─ tipo, mensaje, payload
  ├─ leida, created_at
```

## RLS — RBAC server-side

| Tabla | Director | Operator |
|---|---|---|
| `operators` | SELECT, UPDATE all | SELECT all (read-only), UPDATE own |
| `sprints` | ALL | SELECT all |
| `objectives` | ALL | SELECT all |
| `key_results` | ALL | SELECT all, UPDATE current |
| `missions` | ALL | SELECT where operator_id = auth.uid(), UPDATE progreso/estado de las suyas |
| `events` | ALL | SELECT donde mission pertenezca a ellos, INSERT (comentarios y progreso en sus misiones) |
| `mission_briefs` | ALL | SELECT donde destino_id = auth.uid(), UPDATE leido |
| `notifications` | SELECT all (auditoría) | SELECT/UPDATE own |

Las policies usan `auth.uid()` para identificar el usuario actual y `(SELECT role FROM operators WHERE id = auth.uid())` para el rol.

## Estrategia de migración cliente

**Phase 0 — Foundation (este sprint):** Schema + RLS + cliente JS + abstracción `dataSource`. Sin migrar provider todavía. App sigue funcionando con localStorage por defecto.

**Phase 1 — Auth real:** Reemplazar `login()` por `supabase.auth.signInWithPassword()`. Setup de página de registro.

**Phase 2 — Read path:** Reemplazar `useLocalStorage` por `useSupabaseTable` hook con realtime subscriptions. Lectura llega desde Postgres + invalidaciones.

**Phase 3 — Write path:** Cada `setTasks(...)` → INSERT/UPDATE/DELETE sobre Supabase. El estado local se reconcilia vía realtime.

**Phase 4 — Migración de datos:** Script que toma el localStorage actual del Director y bulk-inserta en Supabase con sus IDs.

**Phase 5 — Deploy Vercel:** Variables de entorno, dominio, smoke test con 2-3 usuarios reales.

## Fallback / rollback

El cliente detecta si `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están definidas. Si no, opera en modo localStorage como hoy. Esto permite:
- Desarrollo offline
- Demos locales sin tocar el backend
- Rollback inmediato si Supabase tiene problemas

## Consecuencias

### Ya entregado (Foundation)
- ADR-003 (este documento)
- `supabase/schema.sql` listo para correr en SQL Editor
- `supabase/seed.sql` con datos iniciales
- `supabase/rls.sql` con policies completas
- `src/lib/supabase.js` cliente JS
- `src/lib/dataSource.js` abstracción
- `.env.example`
- `docs/DEPLOY-SUPABASE.md` guía paso a paso

### Pendiente — Phase 1+
- Auth real (registro + login + reset password)
- Provider migration con realtime
- Script de seed inicial
- Deploy Vercel
- Smoke test multi-usuario

## Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| RLS mal configurada filtra datos cross-Operator | Tests SQL explícitos con jwt fake antes de prod |
| Costo escala más allá de free tier | Free tier cubre 50K MAU; alerta al 80% configurada |
| Realtime no escala con N usuarios | Supabase Realtime soporta 10K conexiones concurrent — sobra |
| Vendor lock-in | Postgres + RLS son estándar; migración a backend propio futuro es viable |
| Datos perdidos en migración | Backup completo del localStorage del Director antes de seed |

## Referencias
- Supabase Auth + RLS: https://supabase.com/docs/guides/auth
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- Vercel Vite deploy: https://vercel.com/docs/frameworks/vite
