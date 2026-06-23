# AXIS — Mission Control

**Mission Control for Modern Teams.**
Plataforma de orquestación táctica para equipos distribuidos: detección automática de crisis, reasignación inteligente, generación de briefings de recuperación y vistas RBAC por rol.

> Anteriormente conocido como NEXUS Command Center. Ver `docs/ADR-001-rebrand-axis.md`.

---

## Arranque rápido (Windows)

Doble click en **`INICIAR.bat`**. La primera vez instala dependencias automáticamente y abre el sistema en `http://localhost:5173`.

## Arranque manual (cualquier sistema)

Requiere **Node.js 18 o superior**.

```bash
npm install
npm run dev
```

El sistema arranca en `http://localhost:5173`.

## Credenciales demo

| Rol | Usuario | Clave |
|---|---|---|
| **Director** (Coronel — vista completa) | `coronel` | `nexus2024` |
| **Operator** PHANTOM | `vega` | `a01` |
| **Operator** CIPHER | `ramos` | `a02` |
| **Operator** NOVA | `torres` | `a03` |
| **Operator** WRAITH | `mendez` | `a04` |
| **Operator** SPECTRE | `reyes` | `a05` |
| **Operator** BLADE | `fuentes` | `a06` |
| **Operator** ECHO | `santos` | `a07` |
| **Operator** VORTEX | `herrera` | `a08` |
| **Operator** MIRAGE | `vargas` | `a09` |
| **Operator** STORM | `castillo` | `a10` |
| **Operator** GHOST | `luna` | `a11` |

> Las credenciales son seed data del MVP. Migrar a Supabase con auth real antes de producción.

---

## Flujos clave

### Como Director (Coronel)
1. **HUD** — grid de los 11 Operators con estado de salud (Operativo / Sobrecarga / Crisis)
2. **Protocolo Charlie** — cuando un Operator entra en CRISIS, se activa el botón rojo. Click → seleccionar misión → asignar mejor candidato → confirmar → SIR generado
3. **SIRs** — historial de todos los briefings de recuperación generados
4. **Métricas** — vista agregada de tareas, criticas, crisis, sobrecargas

### Como Operator
1. **Focus Mode** — solo tus misiones (RBAC enforced en render)
2. **Misiones Críticas** primero, luego otras, luego completadas
3. **Control de progreso accesible**: slider + botones +10/-10 + atajo teclado
4. **SIR Banner** aparece cuando recibes una misión reasignada

---

## Atajos de teclado

| Tecla | Acción |
|---|---|
| `N` | Nueva misión (solo Director) |
| `Tab` / `Shift+Tab` | Navegar entre elementos focusables |
| `Enter` / `Espacio` | Activar el elemento enfocado |
| `Esc` | Cerrar modal, drawer o panel de detalle |
| Flechas `←` `→` (sobre slider) | Ajustar progreso ±5% |

## Flujo del Director — operar AXIS como gestor real

1. **Topbar → Nueva misión** (o tecla `N`) abre el Mission Composer: título, descripción, Operator, prioridad, fecha límite, sprint, KR vinculado, story points (Fibonacci), dependencias
2. **Strategy** → `+ Nuevo Objective` para crear objetivo trimestral; cada Objective expandido tiene `+ Agregar Key Result`
3. **Sprint Selector** (topbar) → `+ Nuevo sprint` para crear ciclos futuros con goal y duración
4. **Command** view → click en Operator → panel lateral con sus misiones; click en cada misión → toggle de Historial con timeline + comentarios
5. **PulseAI** detecta crisis automáticamente; **Re-route Protocol** se activa con un click → wizard de 3 pasos con preview del Mission Brief

---

## Estructura del proyecto

```
src/
├── App.jsx                      # Root + Topbar + routing por rol
├── main.jsx                     # Entry
├── index.css                    # Tailwind base + utilidades HUD
├── context/
│   └── NEXUSContext.jsx         # Single source of truth (memoizado)
├── components/
│   ├── auth/LoginScreen.jsx
│   ├── hud/
│   │   ├── ActivoCard.jsx       # Card por Operator en el grid (a11y completo)
│   │   ├── ActivoDetail.jsx     # Panel lateral con detalles + tareas
│   │   └── DashboardMetrics.jsx # Vista de Métricas
│   ├── activo/FocusMode.jsx     # Vista del Operator (RBAC)
│   ├── protocolo/ModalCrisis.jsx # Wizard Protocolo Charlie 3 pasos
│   ├── sir/
│   │   ├── SIRBanner.jsx        # Banner crítico para Operator
│   │   └── SIRHistorial.jsx     # Vista de SIRs para Director
│   └── ui/
│       ├── NotificationCenter.jsx
│       └── ErrorBoundary.jsx    # Captura crashes, preserva localStorage
├── data/
│   └── seedData.js              # Activos + tareas + algoritmo de salud
└── hooks/
    └── useLocalStorage.js
```

---

## Persistencia

Todo se guarda en `localStorage` con las claves:

| Clave | Contenido |
|---|---|
| `nexus_tasks` | Array de tareas |
| `nexus_sirs` | SIRs generados |
| `nexus_hist` | Historial de reasignaciones |
| `nexus_theme_dark` | Preferencia dark/light |

**Reset completo**: abre DevTools → Application → Local Storage → eliminar las claves anteriores → recargar.

---

## Deploy a producción

### Vercel (recomendado, 1 click)

```bash
npx vercel
```

`vercel.json` ya está configurado.

### Netlify

```bash
npx netlify deploy --prod
```

`netlify.toml` ya está configurado.

### Build manual

```bash
npm run build      # output en dist/
npm run preview    # servir dist/ localmente
```

---

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `npm install` falla con `EACCES` | Permisos | Correr terminal como admin o usar `nvm` |
| Build falla con error de Rollup `linux-x64-gnu` | `node_modules` instalado en otro SO | `rm -rf node_modules package-lock.json && npm install` |
| Pantalla "SISTEMA INESTABLE" | Error JS no controlado | El ErrorBoundary captura el stack — usa "Reintentar sesión" para reset suave o "Reinicio completo" para recargar |
| Datos no se guardan al refrescar | localStorage deshabilitado | Verifica que no estés en modo incógnito |
| El Director no ve crisis | Las 11 tareas seed están sanas | Modifica `seedData.js` o baja el progreso de varias tareas críticas para forzar `salud < 40` |

---

## Stack técnico

- React 18 + Hooks
- Vite 5 (dev + build)
- Tailwind CSS 3 (paletas `axis-*` Deep Space + `nexus-*` legacy)
- Lucide React (iconografía)
- Framer Motion (animaciones, opcional)
- localStorage (persistencia MVP — Supabase planeado post-MVP)

---

## Roadmap

Ver `docs/ADR-001-rebrand-axis.md` para la decisión de marca actual y backlog técnico.

**Próximo sprint:**
- Mission Timeline (historial automático por misión)
- Mission Comments (comunicación Director ↔ Operator)
- Preview SIR antes de confirmar reasignación
- Export PDF semanal de métricas

**Post-MVP:**
- Migración a Supabase con auth real
- WebSockets para colaboración en tiempo real
- TypeScript progresivo
- Tests Vitest + Playwright

---

## Licencia y créditos

Sistema interno. Diseño y arquitectura: equipo AXIS.
