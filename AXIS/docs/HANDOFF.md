# AXIS — Handoff para continuar el desarrollo

**Lee este documento primero.** Apunta a los demás según necesidad.

---

## 1. Qué es AXIS hoy

**Execution OS adaptativo** — sistema que ayuda a cualquier persona a lograr sus metas. Captura contexto del usuario en un Diagnóstico, interpreta el dominio y despliega una metodología personalizada (Playbook): Objective + Key Results + misiones iniciales + ritual semanal + vista HUD.

**Dos modos operativos:**
- **Solo Mode** — el usuario es Lead + único Member. Vista: Focus Mode personal.
- **Squad Mode** — el Lead orquesta un equipo de hasta N Members. Vista: HUD grid + Re-route Protocol.

**Tagline oficial:** *Turn intent into outcomes.*

**No es** un Linear/Asana genérico ni un task tracker. La firma diferencial: **lenguaje táctico calmado** (Mission, Brief, Re-route) + adaptación al dominio del usuario vía Playbooks.

---

## 2. Stack y arranque

- React 18 + Vite 5 + Tailwind 3 + Lucide React + Framer Motion (opcional)
- Persistencia dual: **localStorage** (default, offline) o **Supabase** (cloud, opt-in vía `.env.local`)
- Node 18+ requerido. Probado en Node 24.

**Arranque local:**
```bash
cd C:\Users\capor\OneDrive\Documentos\Claude\Projects\NEXUS\AXIS
# Doble-click INICIAR.bat
# o:
npm install
npm run dev   # http://localhost:5173
```

**Credenciales demo (modo local):**
- Lead: `coronel` / `nexus2024`
- Members: `vega/a01` ... `luna/a11`

---

## 3. Estructura del repo

```
AXIS/
├── INICIAR.bat              # Launcher Windows hardened (verifica vite, pause on error)
├── README.md                # Doc heredado v4.1, parcialmente desactualizado
├── index.html               # ⚠️ NO agregar null bytes al final (ver WORKFLOW.md)
├── package.json             # "axis-execution-os" v4.1.0-foundation
├── public/axis-icon.svg     # Favicon AXIS
├── vite.config.js           # Mínimo, sin alias
├── tailwind.config.js       # Paletas axis-* (Deep Space) + nexus-* (legacy compat)
├── .env.local               # Vacío = modo localStorage
├── .env.local.supabase.bak  # Credenciales Supabase (renombrar para activar cloud)
├── .gitignore
├── docs/
│   ├── HANDOFF.md           ← este archivo
│   ├── ARCHITECTURE.md      # Patrones, capas, decisiones
│   ├── PLAYBOOK_SYSTEM.md   # Subsistema adaptativo nuevo
│   ├── WORKFLOW.md          # Buenas prácticas + gotchas conocidos
│   ├── ROADMAP.md           # Olas pendientes priorizadas
│   ├── ADR-001-rebrand-axis.md
│   ├── ADR-002-modelo-datos-v4.md
│   ├── ADR-003-supabase-foundation.md
│   ├── DEPLOY-SUPABASE.md
│   ├── OPERACION-GO-LIVE.md
│   └── PRODUCT-VISION-v4.md
├── src/
│   ├── main.jsx · App.jsx · index.css
│   ├── context/NEXUSContext.jsx        # Single source of truth (memoizado)
│   ├── data/
│   │   ├── seedData.js                 # Lead + Members + tareas demo + algoritmo salud
│   │   ├── missionTemplates.js
│   │   └── playbooks.js                ⭐ Catálogo de Playbooks v1
│   ├── lib/
│   │   ├── dataSource.js               # Abstracción local/supabase
│   │   ├── mappers.js                  # snake_case ↔ camelCase
│   │   ├── supabase.js                 # Cliente, isSupabaseEnabled, fetchMyProfile
│   │   └── playbookEngine.js           ⭐ Motor de matching + despliegue
│   ├── components/
│   │   ├── onboarding/
│   │   │   └── OnboardingDiagnostic.jsx  ⭐ Wizard de 7 pasos + preview
│   │   ├── auth/LoginScreen.jsx
│   │   ├── hud/{ActivoCard, ActivoDetail, DashboardMetrics}.jsx
│   │   ├── activo/FocusMode.jsx       # Vista personal (Member + Solo Mode)
│   │   ├── protocolo/ModalCrisis.jsx  # Wizard Re-route 3 pasos
│   │   ├── sir/{SIRBanner, SIRHistorial}.jsx
│   │   ├── mision/{MissionComposer, MissionTimeline}.jsx
│   │   ├── strategy/StrategyView.jsx
│   │   ├── sprint/SprintRetroModal.jsx
│   │   ├── capacity/{CapacityView, TeamView}.jsx
│   │   ├── admin/{InviteOperatorModal, OperatorsAdmin}.jsx
│   │   └── ui/{ErrorBoundary, NotificationCenter, CommandPalette, QuickForm, SprintSelector}.jsx
│   └── hooks/useLocalStorage.js
└── supabase/                # Schema, RLS, seed, edge function invite-operator (modo cloud)
```

⭐ = piezas nuevas del subsistema adaptativo, ver `PLAYBOOK_SYSTEM.md`.

---

## 4. Lo que YA funciona (verificado end-to-end)

### Base (v4.1)
- ✅ Build limpio (`npm run build` → ~1593 módulos, ~100 KB gzip principal, ~6-9s)
- ✅ `npm test` → 53/53 tests pasan (playbookEngine + smartDefaults + timeBox + seedData)
- ✅ Dev server sirve HTTP 200 en localhost:5173
- ✅ Login local con seed users (coronel + 11 members)
- ✅ Onboarding Diagnóstico de 7 pasos → matching Playbook → preview → despliegue real
- ✅ Solo Mode + Squad Mode con rutas diferenciadas
- ✅ Persistencia localStorage + migración soft v3→v4
- ✅ ErrorBoundary preserva localStorage en crashes
- ✅ Modo Supabase: schema/RLS/seed listos (ver `DEPLOY-SUPABASE.md`)

### Olas 3-7 (Ejecución intencional)
- ✅ **Ola 3** — Vistas HUD adaptadas por dominio: `StandardHUD`, `PipelineHUD` (founder), `StreakHUD` (habits/atleta/estudiante/idioma), `MultiTrackHUD` (admin/creador). Switch automático por `userPlaybook.vistaHUD` en CoronelHUD (Squad) y FocusMode (Solo).
- ✅ **Ola 4** — `WeeklyReviewModal` con auto-trigger por `ritualSemanal` (chequeo cada 5 min, cooldown 20 h). Recap/Stuck/Planning/Notes. Las misiones de Planning se crean como tareas reales. Entrada manual via botón Topbar.
- ✅ **Ola 5** — `streakActual` memoizado en context. Badge `🔥 N días` en Topbar con accent dorado ≥7 días.
- ✅ **Ola 6** — Catálogo de **13 Playbooks**: founder-business, habits-health, admin-multifaceted, atleta-deportista, estudiante-examen, creador-output, carrera-profesional, padres-crianza, investigador-tesis, disenador-output, idioma-fluido, pareja-relacion, custom-okr.
- ✅ **Ola 7** — `SettingsView` con secciones Playbook (rehacer diagnóstico), Modo (Solo/Squad toggle), Tema, Weekly Review, Datos (Export/Import JSON + Reset total 2-step).

### Olas 8-9 (Inteligencia adaptativa)
- ✅ **Ola 8 (Heurística v2)** — Matching pasó de regex binaria a **scoring multi-dimensional**: dominio (50) + meta (25) + frenos (10) + tiempo (10) + medición (5). `scorePlaybook`, `matchPlaybook`, `explainPlaybookMatch` puros y testeados. Bug detectado y arreglado por tests: `custom-okr` ya no matchea por meta (era `/./`).
- ✅ **Ola 9 (Insights)** — `insights` memo en context: sobrecarga (`NOMINAL/AMARILLO/ROJO`), ritmo (`ACELERANDO/SOSTENIDO/PLANO/DESACELERANDO`), energía (`ALTO/MEDIO/BAJO`), KRs estancados, misiones sin movimiento ≥5 días. `InsightsPanel` con 4 semáforos + lista de acciones recomendadas + nav item `/insights`.

### Olas 10-11 (Eficiencia neurológica TDAH/TLP)
- ✅ **NowMode** (`components/now/NowMode.jsx`, atajo **F**) — Vista de UNA sola misión en pantalla completa. Selección automática (CRITICA → ALTA con menor progreso → primera activa). Lenguaje compasivo, ESC sale.
- ✅ **TimeBox flexible** (`lib/timeBox.js` + `components/now/TimeBox.jsx`) — 4 modos: Pomodoro (25/45/90), Hoy (hasta medianoche), Esta semana (hasta domingo 23:59), Custom (1-600 min). Persistencia `axis_focus_commitment` sobrevive refresh.
- ✅ **MorningBrief** banner en FocusMode (5am-12pm, una vez al día) — saludo + 3 misiones priorizadas + KR rezagado + CTA "abrir en Now Mode".
- ✅ **MissionCelebration** — micro-animación al `axis:mission:completed`. Tarjeta flotante con frase rotativa, auto-dismiss 1.8s. Respeta `prefers-reduced-motion`.
- ✅ **WelcomeBackBanner** — al login tras ≥24h. Continuidad emocional (TLP): "no perdiste nada, te recuerdo dónde lo dejamos" + última misión con más progreso → CTA continuar.
- ✅ **SmartSuggestionsRow** en MissionComposer — chips de sugerencias (prioridad por keywords, fecha por prioridad, story points Fibonacci por descripción). No impone, ofrece.
- ✅ **Smart Defaults helpers** (`lib/smartDefaults.js`) — `suggestDueDate`, `suggestStoryPoints`, `suggestNextMission`, `tinyNextAction`, `suggestPriority`.
- ✅ **QuickCapture** (atajo **I**) — inbox ultra-rápido. Prefijos `!`/`*`/`-` para prioridad. Enter guarda; Cmd+Enter guarda y captura otra. Combate olvido fugaz (TDAH).
- ✅ **KeyboardShortcuts panel** (atajo **?**) — lista descubrible de todos los atajos.
- ✅ **Empty states compasivos** — copy reescrito en FocusMode/PipelineHUD/StreakHUD/MultiTrackHUD sin tono juzgante.
- ✅ **`prefers-reduced-motion`** global en `index.css` — desactiva animaciones largas, stagger, crisis-pulse para usuarios sensibles.

## 5. Lo que NO está hecho (siguientes olas)

Resumen — detalle priorizado en `ROADMAP.md`:

1. **Modo "Sin distracciones"** en HUDs — ocultar stats secundarias, dejar solo la siguiente acción.
2. **Daily Pulse async** — 30s al cierre del día, alimenta tendencias en Insights.
3. **Visual de "energía estimada por hora"** — sugiere misiones livianas vs profundas según contexto.
4. **Tests de componentes con `renderWithProviders`** — coverage de FocusMode, NowMode, MorningBrief, WelcomeBackBanner, QuickCapture.
5. **Audit a11y completo** — focus trap en modales, contraste WCAG AA en todos los accents.
6. **Animación Framer Motion** entre vistas HUD adaptadas — transición elegante al cambiar de playbook.
7. **Migración progresiva a TypeScript** — opcional, post-MVP.
8. **Tests E2E con Playwright** — flujos críticos: onboarding completo, re-route, weekly review.

---

## 6. Convenciones críticas

**Nombres legacy preservados en código:**
- `CORONEL` (interno) = `Lead` (UI). RBAC sigue checando `role === 'CORONEL'`.
- `ACTIVO` (interno) = `Member` (UI). Los IDs son `A01..A11`.
- `CRISIS / CHARLIE` (interno, en `alertLevel`) = `Bloqueo` (UI).

**NO renombres los identificadores internos** — rompe RBAC, RLS y migraciones. Solo cambia strings visibles.

**Persistencia local — claves localStorage:**
| Clave | Contenido |
|---|---|
| `nexus_tasks` | tareas (legacy, no rename) |
| `nexus_sirs` | Mission Briefs generados |
| `nexus_hist` | Historial de re-routes |
| `axis_sprints` | Sprints |
| `axis_objectives` | Objectives |
| `axis_key_results` | KRs |
| `axis_schema_version` | versión esquema para migración |
| `axis_user_playbook` | playbook activo del usuario |
| `axis_mode` | `'solo' \| 'squad'` |
| `axis_review_log` | array de Weekly Reviews registradas |
| `axis_last_review` | ISO timestamp del último review |
| `axis_focus_commitment` | TimeBox activo (modo + startedAt + param) |
| `axis_last_brief_at` | ISO del último MorningBrief mostrado |
| `axis_last_login` | ISO del último login (para WelcomeBackBanner) |
| `nexus_theme_dark` | bool tema |

**Sesión de navegador (sessionStorage):**
| Clave | Contenido |
|---|---|
| `axis_welcome_shown` | flag para no repetir WelcomeBack en la misma sesión |

**Reset total para probar onboarding desde cero:**
DevTools → Application → Local Storage → eliminar claves `nexus_*` y `axis_*` → reload.

---

## 7. Cómo continuar (workflow recomendado)

1. **Lee** `ARCHITECTURE.md` para entender capas y decisiones.
2. **Lee** `PLAYBOOK_SYSTEM.md` antes de tocar el subsistema adaptativo.
3. **Lee** `WORKFLOW.md` para evitar trampas (OneDrive sync, null bytes, etc.).
4. **Lee** `ROADMAP.md` y elige una ola.
5. Antes de codear, **siempre `npm run build` para confirmar baseline**.
6. Cambios chicos → `Edit` quirúrgico. Archivos nuevos → `Write`.
7. Tras cambios → `npm run build` de nuevo. Si pasa, smoke test manual del flow tocado.
8. Si modificas `NEXUSContext.jsx`, verifica que la lista de dependencias del `useMemo(value, [...])` incluye toda variable nueva expuesta.

**Estilo:**
- React funcional + hooks. No clases (excepto `ErrorBoundary` que las requiere).
- Tailwind utility-first. Solo agregar CSS custom en `index.css` si la utilidad no existe o se reutiliza ≥3 veces.
- Imports relativos (`'../../context/NEXUSContext'`). No hay alias configurado.
- Comentarios en español, identificadores en inglés o español según el patrón existente del archivo.
- `console.error` para errores reales, `console.info` para diagnósticos. Nada de `console.log` en commits.

---

## 8. Prioridad inmediata sugerida

**Ola 3 — Vistas HUD adaptadas por dominio.** Es la pieza más visible que conecta los Playbooks (datos) con la experiencia (UX). Sin esto, el Solo Mode se siente igual sin importar tu Playbook.

Esfuerzo estimado: 1 sesión. Cambios concentrados en:
- `CoronelHUD` (App.jsx) en Squad Mode → render condicional por `userPlaybook.vistaHUD`
- `FocusMode` en Solo Mode → render condicional por `userPlaybook.vistaHUD`
- 3 nuevos componentes ligeros: `PipelineHUD`, `StreakHUD`, `MultiTrackHUD`

Ver desglose en `ROADMAP.md`.
