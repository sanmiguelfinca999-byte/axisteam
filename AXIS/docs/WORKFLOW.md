# AXIS — Método de trabajo y gotchas

## Workflow estándar para una mejora

1. **Baseline**: `npm run build` debe pasar antes de empezar. Si no pasa, arregla eso primero.
2. **Planear**: identifica los archivos a tocar. Lista cambios mínimos. Evita renombres masivos.
3. **TaskList**: usa el sistema de tareas del agent (TaskCreate/TaskUpdate) para tracking visible al usuario.
4. **Aplicar**: prefiere `Edit` quirúrgico. Solo `Write` para archivos nuevos o reescrituras completas.
5. **Build de verificación**: `npm run build` tras cambios. Si rompe, revisa stack trace.
6. **Smoke test**: `npm run dev` + curl o navegador. Para flows complejos: Manual UI walkthrough.
7. **Entregar**: usa `present_files` con los archivos clave nuevos/modificados.

## Reglas de oro

- **Lee antes de editar.** El tool `Edit` requiere que hayas hecho `Read` del archivo en la sesión actual. Si la sesión se reinicia (system reminders, etc.), re-lee.
- **Lee solo el rango que necesitas.** No `Read` del archivo entero para editar una línea — usa `offset`/`limit`.
- **Una sola fuente de verdad por dato.** Si lo guardas en localStorage, no lo dupliques en state. Usa `useLocalStorage` que sincroniza ambos.
- **Memoiza correctamente.** Toda variable que expongas en el `value` del context DEBE estar en la lista de dependencias del `useMemo`. Olvido → stale closure → bug invisible.
- **Tailwind > CSS custom.** Si añades CSS a `index.css`, justifícalo con reuso ≥3 veces o utilidad inexistente.

## Convenciones de naming

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componente React | PascalCase | `OnboardingDiagnostic` |
| Hook | camelCase + prefijo `use` | `useLocalStorage` |
| Función pura | camelCase | `matchPlaybook` |
| Constante exportada | UPPER_SNAKE | `SEED_TASKS`, `PLAYBOOK_OPTIONS` |
| ID de mission | `T-{base36}` | `T-LZ8K3M` |
| ID de SIR | `MB-{base36 upper}` | `MB-LZ8K3M` |
| ID de KR | `KR-{obj-suffix}-{A..Z}` | `KR-Q3-01-A` |
| Clave localStorage | `nexus_*` (legacy) o `axis_*` (nueva) | `axis_user_playbook` |

## Gotchas conocidos

### G1. OneDrive sync introduce desfases

El repo vive en OneDrive sincronizado. Los archivos pueden tardar segundos en propagarse entre el filesystem real de Windows y el sandbox bash de Linux. Síntomas observados:

- `Read` tool muestra archivo completo, pero `cat` en bash lo muestra truncado.
- `Write`/`Edit` aplicados desde Windows tardan en aparecer en bash.
- `cp` en bash copia la versión vieja del archivo.

**Mitigación:**
- Cuando hagas `cp` o `cat` y veas contenido truncado/viejo, espera 3-5 s y reintenta.
- Si necesitas garantizar versión más reciente, usa `bash heredoc` directamente al path de OneDrive.
- Para builds: ya hubo un caso donde `index.html` quedó con un null byte (`\x00`) al final que rompía Vite. Si ves `unexpected-null-character` en parse5, reescribe el archivo con heredoc.

### G2. `node_modules` corrupto si npm install se interrumpe

Si `npm install` se mata a media (timeout, Ctrl+C), `node_modules` queda con paquetes parciales y FALTA `node_modules/.bin/vite.cmd`. El launcher `INICIAR.bat` ahora detecta esto y reinstala automáticamente, pero si modificas el .bat, mantén ese check.

### G3. `coronel` no tenía `id` en seedData original

Se agregó `id: 'LEAD'` en el rebrand. Si vuelves a tocar `CORONEL_CREDENTIALS`, mantén el `id` — es necesario para Solo Mode (las misiones del Lead se asocian a este id).

### G4. Modo cloud requiere setup manual

`.env.local` está intencionalmente vacío para que el primer arranque sea offline. Si activas Supabase (renombrando `.env.local.supabase.bak`), tienes que correr ANTES los SQL de `supabase/schema.sql`, `supabase/rls.sql`, `supabase/seed.sql` y crear usuarios con `supabase/setup-accounts.mjs`. Ver `DEPLOY-SUPABASE.md`.

### G5. CRISIS interno != "Bloqueo" UI

En el rebrand, las etiquetas visuales cambiaron a "Bloqueo" pero el código sigue usando `'CHARLIE'` como `alertLevel` y `setModalCrisis` como nombre de acción. **No renombres estos identificadores** sin actualizar todas las referencias — RBAC checks, mappers de cloud, payloads de eventos, etc.

### G6. Lazy chunks cambian de hash en cada build

Los assets `StrategyView-XXX.js`, `SIRHistorial-XXX.js`, etc., tienen hash en el nombre. Eso es normal y deseable (cache busting). No es un bug.

### G7. ErrorBoundary no captura errores en useEffect / promesas

Las promesas no atrapadas pasan por encima del boundary. Cuida los `try/catch` en `useEffect` async (especialmente el `boot` del context en modo cloud, que ya tiene `.catch(err => ...)`). Si añades nuevos `useEffect` con código async, envuelve en try/catch.

## Performance — guía rápida

- **Bundle actual**: ~297 KB JS principal, 87 KB gzip. Aceptable. Por debajo de los 300 KB es la meta.
- **Si crece**: revisa imports de `framer-motion` (es pesado). Está marcado como opcional — sólo úsalo en componentes que SI necesitan animación compleja.
- **Re-renders**: si una vista parpadea o lagea, sospecha del context. Usa React DevTools Profiler. La solución suele ser dividir el `value` en sub-contextos o memoizar mejor componentes hijos con `memo()` + comparadores selectivos.
- **localStorage**: el hook `useLocalStorage` serializa con JSON en cada `setValue`. Si guardas arrays de >1000 items, debounce las escrituras.

## Tests (cuando los añadas)

- Vitest para unit (jsdom env)
- Playwright para E2E
- Mock de `localStorage` con `vitest-localstorage-mock`
- Cubrir primero: `playbookEngine` (puro, fácil), `calcularSaludActivo` (puro), mappers (puros)
- Los componentes con context: usar `renderWithProviders` helper que envuelve en `NEXUSProvider`

## Patrón para subagentes (si delegas)

Si en una sesión decides delegar a un sub-agente (general-purpose, Explore, etc.) para tareas grandes:

- **Brief auto-contenido**: el sub-agente no ve la conversación. Dale paths absolutos, contexto del por qué, y formato esperado del output.
- **Verificación**: el resumen del sub-agente describe intención. Lee los diffs reales antes de reportar al usuario.
- **Para investigación**: usa el agent `Explore` con `quick / medium / very thorough`.
- **Para implementación grande**: `general-purpose` con `isolation: "worktree"` para evitar romper el repo en caso de fallo.

## Commits (cuando inicialices git)

Convención sugerida: Conventional Commits.

```
feat(playbook): add atleta-deportista playbook
fix(onboarding): repair wizard navigation when frenos is empty
refactor(context): split applyPlaybook into smaller actions
docs: update HANDOFF with cloud setup notes
chore: bump vite to 5.5
```

## Anti-patrones a evitar

❌ Lógica de negocio dentro de componentes UI (mover al context o lib).
❌ `useState` para datos que deben persistir (usar `useLocalStorage`).
❌ Mutaciones de arrays/objetos del state (siempre spread/map para mantener inmutabilidad).
❌ `useEffect` sin deps (`[]`) si dependen de algo del scope. Usa la deps array correcta.
❌ Imports profundos a `node_modules/*` (rompe el bundler tree-shaking).
❌ Strings militares duros (`CRISIS`, `PROTOCOLO CHARLIE`, `CHARLIE`) en UI nueva — usa el rename calmado.
❌ Eliminar `.env.local.supabase.bak` sin antes haber migrado a `.env.local`.
