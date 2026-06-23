# AXIS — Arquitectura

## Capas

```
┌─────────────────────────────────────────────────────┐
│  UI (components/*)                                  │
│  - Render puro, usa hooks del contexto              │
│  - No fetches directos, no localStorage directo     │
├─────────────────────────────────────────────────────┤
│  Context (context/NEXUSContext.jsx)                 │
│  - Single source of truth                           │
│  - State + acciones (CRUD missions/sprints/KRs/...) │
│  - useMemo en el `value` exportado                  │
│  - Decide local vs cloud según MODE                 │
├─────────────────────────────────────────────────────┤
│  Lib (lib/*)                                        │
│  - dataSource.js: abstracción local/supabase        │
│  - mappers.js: snake_case ↔ camelCase               │
│  - supabase.js: cliente + auth helpers              │
│  - playbookEngine.js: motor adaptativo (puro)       │
├─────────────────────────────────────────────────────┤
│  Data (data/*)                                      │
│  - seedData.js: Lead + Members + tareas iniciales   │
│  - playbooks.js: catálogo de Playbooks              │
│  - missionTemplates.js                              │
├─────────────────────────────────────────────────────┤
│  Persistence                                        │
│  - localStorage (hooks/useLocalStorage.js)          │
│  - Supabase (Postgres + RLS + Realtime + Auth)      │
└─────────────────────────────────────────────────────┘
```

**Regla de dirección de dependencia:** UI → Context → Lib → Data → Persistence. Nunca al revés.

## Decisiones técnicas clave

### D1. Single Context, no Redux
`NEXUSContext` concentra estado y acciones. Razón: AXIS no tiene más de ~12 stores semánticos; un context memoizado rinde mejor que la sobrecarga de Redux/Zustand para este tamaño. Si el `value` crece >40 props, considerar dividir en contextos por dominio (Mission, OKR, Auth, UI) — no antes.

### D2. Modo dual (local/cloud) decidido en boot
`lib/dataSource.js` exporta `MODE = isSupabaseEnabled ? 'supabase' : 'local'`. Se decide leyendo `import.meta.env.VITE_SUPABASE_URL`. No hay toggle en runtime. Ventaja: demos offline + onboarding sin backend + rollback inmediato si Supabase falla. Limitación: cambiar de modo requiere refrescar la pestaña.

### D3. Mappers explícitos snake/camel
Supabase usa snake_case; el frontend usa camelCase. Mappers en `lib/mappers.js` (`missionFromDb`, `missionToDb`, etc.). **No** uses snake_case en el cliente. **No** uses camelCase en queries Supabase.

### D4. Events como tabla separada en cloud, embebidos en local
En cloud, eventos van a tabla `events`. En local, viven dentro del array `tarea.eventos` del task. El context hidrata tasks con eventos en cloud (vía `useMemo`). Razón: evita hot-rows en Supabase y permite filtrado por mission_id eficiente.

### D5. RLS preservado en código
El check `currentUser.role === 'CORONEL'` ocurre en RENDER. La RLS de Supabase es la auténtica fuente de seguridad. **No confiar en el render check para datos sensibles** — un usuario malicioso puede bypass UI. La RLS de `supabase/rls.sql` debe ser la verdad.

### D6. Lazy loading de vistas secundarias
`StrategyView`, `SIRHistorial`, `DashboardMetrics`, `TeamView` se cargan con `React.lazy()`. Reduce el bundle inicial de ~300 KB a ~270 KB (los chunks lazy suman ~47 KB extra opt-in).

### D7. Playbook como subsistema desacoplado
`lib/playbookEngine.js` es **puro** (sin side effects, sin imports de context). El context lo invoca al final del onboarding y aplica el output. Esto permite testear el motor sin React y reusarlo en CLI o backend si hace falta.

### D8. ErrorBoundary preserva localStorage
La pantalla "SISTEMA INESTABLE" tiene dos botones: *Reintentar sesión* (resetea el boundary, mantiene estado) y *Reinicio completo* (reload sin borrar localStorage). Nunca borrar storage en el error path.

## Modelo de datos (resumen)

### Mission
```ts
{
  id: string,                 // T-{base36}
  activoId: string,           // ref a Member (A01..A11 o 'LEAD')
  titulo, descripcion: string,
  prioridad: 'CRITICA' | 'ALTA' | 'NORMAL' | 'BAJA',
  estado: 'EN_PROGRESO' | 'COMPLETADA',
  progreso: 0..100,
  fechaCreacion, fechaLimite: ISO 8601,
  misionCritica: bool,
  reasignada: bool,
  sirId: string | null,       // ref a Mission Brief
  sprintId: string | null,
  keyResultId: string | null,
  bloqueaA: string[],         // misiones bloqueadas por esta
  bloqueadaPor: string[],
  storyPoints: number | null, // Fibonacci sugerido
  eventos: Event[],           // embebidos en local, separados en cloud
}
```

### Operator / Member (incl. Lead)
```ts
{ id, username, password, role, nombre, codename, especialidad, avatar, rolLabel? }
```
Roles internos: `'CORONEL'` (Lead) y `'ACTIVO'` (Member). Mappers añaden `roleSemantic` desde cloud (`'DIRECTOR' | 'OPERATOR'`).

### Sprint
```ts
{ id, nombre, goal, fechaInicio, fechaFin, estado: 'UPCOMING'|'ACTIVE'|'COMPLETED', retro: object|null }
```

### Objective / KR
```ts
Objective: { id, titulo, descripcion, periodo, ownerId, estado, fechaCreacion }
KR: { id, objectiveId, titulo, metrica, target, current, unit, trend: 'UP'|'DOWN', posicion }
```

### UserPlaybook (nuevo)
```ts
{
  id: 'founder-business' | 'habits-health' | 'admin-multifaceted' | 'custom-okr',
  nombre, vistaHUD, ciclo, ritualSemanal,
  diagnostico: object,        // las 7 respuestas
  deployedAt: ISO 8601,
}
```
Persistido en `localStorage['axis_user_playbook']`.

## Algoritmo de salud (Member)

`src/data/seedData.js::calcularSaludActivo()`:
```
salud = progresoPromedio * 0.5
      + (100 - indSaturacion) * 0.3
      + (100 - penalizacion) * 0.2

donde:
  indSaturacion = min(100, (activas/4)*100)
  penalizacion  = (criticas * 15) + (vencidas * 20)

niveles:
  salud >= 70  → 'EN MARCHA' (color: green, alertLevel: NOMINAL)
  40-69        → 'SOBRECARGA' (yellow, BRAVO)
  < 40         → 'BLOQUEO'    (red, CHARLIE)
```

`alertLevel` se calcula en el `useMemo activosConSalud`. **El alertLevel 'CHARLIE' habilita el botón Re-route.**

## Re-route Protocol (3 pasos)

Componente: `ModalCrisis.jsx`. Lo dispara cualquier card con `alertLevel === 'CHARLIE'`.

1. **Step 1** — Elige misión (CRITICA o ALTA) del Member bloqueado.
2. **Step 2** — Sistema sugiere top-3 candidatos vía `obtenerCandidatosParaTarea()` (score = saturación + especialidad + disponibilidad).
3. **Step 3** — Preview SIR (Mission Brief) → confirmar → `ejecutarReasignacion()` cambia `activoId`, marca `reasignada=true`, genera SIR, registra evento, notifica.

El SIR es el artefacto clave — un brief estructurado de 6 instrucciones que el nuevo Member recibe. Ver `generateSIR()` en `NEXUSContext.jsx`.

## Estilo / Identidad visual

### Paleta (Tailwind tokens)
- **axis-*** (Deep Space, nueva): void/deep/edge/text/dim/glow/pulse/flare/solar/leaf/purple
- **nexus-*** (legacy compat): bg/surface/border/text/muted/green/yellow/red/blue/purple

Usar `axis-*` para nuevos componentes. `nexus-*` se mantiene para no romper componentes legacy.

### Componentes CSS (`index.css`)
- `surface-base / surface-card / surface-elevated / surface-floating` (jerarquía de profundidad)
- `hud-card / glass-bar / hud-btn-{primary,danger,ghost}`
- `crisis-pulse` (animación calmada 2.4s ease, suave)
- `mesh-bg` (fondo decorativo con gradients radiales)
- `stagger-in` (entrada escalonada de cards)

### Animaciones
- `fadeIn`, `slideIn`, `stagger-fade-up` — entradas
- `status-pulse` — puntito de estado (1.6s)
- `crisis-soft` — borde de bloqueo (2.4s, calmado)
- **EVITAR**: `animate-blink` (descontinuado), `animate-orbit` (no usado)
- **DEPRECATED**: clase `.scanlines` (queda en CSS pero no se aplica)

## Patrón: agregar una vista nueva

1. Crear `src/components/<area>/MiVista.jsx`
2. Lazy import en `App.jsx`: `const MiVista = lazy(() => import('./components/<area>/MiVista'))`
3. Agregar nav item en `Topbar`:
   ```js
   { id: 'mi-vista', label: 'Mi etiqueta', icon: AlgúnIcon }
   ```
4. Branch en el render del `AppInner`:
   ```js
   activeView === 'mi-vista' ? <div className="h-full overflow-y-auto"><ViewSuspense><MiVista /></ViewSuspense></div> :
   ```
5. La vista consume `useNEXUS()` para datos.

## Patrón: agregar acción al context

1. Definir `useCallback` dentro de `NEXUSProvider`
2. Si necesita persistir: en local → `set*Local(...)`; en cloud → `supabase.from(...)`. Idealmente, abstrae detrás del helper `persistMission`/`removeMission` que ya distingue modos.
3. Exponerla en el `value`:
   ```js
   const value = useMemo(() => ({
     ...,
     miAccion,
   }), [..., miAccion])
   ```
4. Añadir `miAccion` a la lista de deps del `useMemo`. **Olvidarla causa stale closures silenciosos.**
