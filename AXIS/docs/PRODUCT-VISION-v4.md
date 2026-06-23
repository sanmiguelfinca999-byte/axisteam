# AXIS v4 — Product Vision: The Execution OS

> **De "Mission Control" a "Execution Operating System".**
> AXIS deja de ser un tracker táctico para convertirse en la capa de sistema que orquesta sprints, OKRs, dependencias y ceremonias ágiles para cualquier equipo ambicioso.

---

## 1. Tesis de producto

| Antes (v3) | Ahora (v4) |
|---|---|
| Tactical operations platform | The Execution OS |
| Orquestación de tareas | Garantía de ejecución |
| Comando-control jerárquico | Marco ágil agnóstico de jerarquía |
| Para equipos militares/operativos | Para cualquier equipo ambicioso |

**Tagline:** *Where ambitious teams turn strategy into shipped outcomes.*

**Why now:** Mission Control limita el TAM. Los compradores B2B de 2026 buscan herramientas que materialicen su metodología (sprints, OKRs, dailies async) — no solo registren tareas. Linear, Notion, ClickUp ya pivotaron. Quedarse en "task tracker" significa competir con Trello a precio cero.

---

## 2. Marco ágil que AXIS materializa (capas)

```
┌─────────────────────────────────────────────────┐
│ Layer 4 — STRATEGY     │ OKRs, North Star Goal  │
├─────────────────────────────────────────────────┤
│ Layer 3 — PLANNING     │ Sprints, Capacity,     │
│                        │ Dependencies, Templates│
├─────────────────────────────────────────────────┤
│ Layer 2 — EXECUTION    │ Missions, Progress,    │
│                        │ Comments, Timeline     │
├─────────────────────────────────────────────────┤
│ Layer 1 — RITUALS      │ Daily Pulse async,     │
│                        │ Sprint Review, Retro   │
├─────────────────────────────────────────────────┤
│ Layer 0 — INTELLIGENCE │ PulseAI, RouteAI,      │
│                        │ BriefAI, Re-route      │
└─────────────────────────────────────────────────┘
```

Cada capa se sostiene en sustento metodológico:

| Capa | Mecánica | Sustento (referencia + por qué) |
|---|---|---|
| OKRs | Objective → Key Result → Mission | Doerr "Measure What Matters": trazabilidad sube ship rate ~30% |
| Sprints | Ciclos 1-4 sem con Sprint Goal | Sin marco temporal, el backlog se vuelve cementerio |
| Capacity | Predictivo, no reactivo | Salud actual = bombero. Capacity = arquitecto |
| Dependencies | Grafo bloqueaA[] | 60% retrasos vienen de dependencias no rastreadas (Standish) |
| Daily Pulse async | Reporte 30s, no reunión | Standups síncronos pierden 50% del tiempo (Atlassian 2024) |
| Sprint Retro | Auto-generada con datos | Retros sin datos terminan en anécdotas |
| Templates | Bibliotecas reusables | Equipos maduros estandarizan 30-40% del trabajo recurrente |

---

## 3. Roadmap priorizado

### Sprint A1 — Foundation (Strategy + Planning core)
- **Modelo de datos**: agregar `Sprint`, `Objective`, `KeyResult`, vincular Misión↔Sprint y Misión↔KR
- **Sprint Selector** en topbar: dropdown con sprint activo, badge días restantes
- **Sprint Goal banner** en HUD y Focus Mode
- **OKR Tree view** (nueva ruta para Director): objetivos → KRs → misiones vinculadas
- **Cmd+K command palette** (búsqueda global + acciones)

### Sprint A2 — Productivity (Visibility & coordination)
- **Capacity Planning view** (semana actual + próxima, saturación por Operator)
- **Dependencies**: campo `bloqueaA[]`, badge "bloqueada por X" en cards, mini-grafo en ActivoDetail
- **Density modes** (Compact / Comfortable / Spacious)
- **Live indicators** (dot pulsante en datos en tiempo real)

### Sprint A3 — Rituals (Agile ceremonies)
- **Daily Pulse async**: Operator reporta progress/blocker en 30s, agregado en Director view
- **Sprint Retro auto-generada**: al cerrar sprint, AXIS sintetiza ganancias/fricciones/reasignaciones
- **Velocity + Burndown** charts por sprint
- **Notificaciones inteligentes** (no spammy: solo lo accionable)

### Sprint A4 — Maturity (Polish + export)
- **Mission Templates**: 5 base (onboarding, deploy, launch, post-mortem, hiring)
- **Smart Digest semanal**: export Markdown/PDF para stakeholders externos
- **Empty states con personalidad** (SVG ilustradas)
- **Keyboard shortcuts globales** documentados

---

## 4. Modernización visual — sistema de diseño v4

### Principios
1. **Profundidad sin ruido** — 4 niveles de elevación (base, surface, elevated, floating) con sombras diferenciadas. Material 3 + Vision OS.
2. **Tipografía dual** — Space Grotesk display + Inter cuerpo + JetBrains Mono solo para datos crípticos (IDs, timestamps, codes). Vercel design system.
3. **Color semántico expandido** — escalas progresivas de 7 stops por status (success/warning/danger/info), no binarios.
4. **Microinteracciones con propósito** — hover lift -2px, spring physics en cards, stagger 30ms en grids, skeleton loaders. Framer Motion ya instalado.
5. **Glassmorphism selectivo** — solo en topbar, modales y panels de alta jerarquía. Linear, Arc, Raycast.
6. **IA visible** — chip "AI suggestion", pulse en agentes, sparkles en sugerencias generadas.
7. **Density adaptable** — el usuario elige Compact / Comfortable / Spacious.

### Token system v4 (extensión de axis-*)

```js
// Elevation
elevation: {
  base:     'bg-axis-void',                  // página
  surface:  'bg-axis-deep',                  // card
  elevated: 'bg-axis-deep shadow-axis-md',   // selected card / panel
  floating: 'bg-axis-deep/95 backdrop-blur shadow-axis-lg', // modal
}

// Semantic scale (ej. success)
success: { 50, 100, 200, 400, 600, 800, 900 }
warning: { 50, 100, 200, 400, 600, 800, 900 }
danger:  { 50, 100, 200, 400, 600, 800, 900 }
info:    { 50, 100, 200, 400, 600, 800, 900 }

// Motion
motion: {
  duration: { fast: 150, base: 250, slow: 400 },
  ease:     { spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)', smooth: 'cubic-bezier(0.4, 0, 0.2, 1)' },
}
```

### Componentes a rediseñar (en orden)

| # | Componente | Cambio | Sprint |
|---|---|---|---|
| 1 | ActivoCard | Avatar inicales, stat grid 3x1, KR mini, status chip moderno | A1 |
| 2 | Topbar | Sprint selector, Cmd+K hint, density toggle, glassmorphism | A1 |
| 3 | LoginScreen | Mesh gradient sutil, logo orbital animado, copy refinado | A1 |
| 4 | OKR Tree | Visualización jerárquica con conexiones SVG | A1 |
| 5 | Capacity view | Heatmap semanal por Operator | A2 |
| 6 | Cmd+K palette | Glassmorphism, fuzzy search, atajos | A2 |
| 7 | Daily Pulse | Form async 30s con prompts inteligentes | A3 |
| 8 | Retro view | Auto-síntesis con secciones editables | A3 |
| 9 | Empty states | Ilustraciones SVG + copy ingenioso | A4 |
| 10 | Digest semanal | Layout editorial estilo Stripe Press | A4 |

---

## 5. Criterios de éxito

| Criterio | Métrica | Target |
|---|---|---|
| Adopción de marco ágil | % de misiones vinculadas a un Sprint | >85% |
| Trazabilidad estratégica | % de Misiones vinculadas a un KR | >60% |
| Visibilidad de bloqueos | % de dependencias declaradas vs. detectadas post-mortem | >70% |
| Async first | Caída de reuniones por equipo | -30% |
| Performance | Time to Interactive en login | <1.5s |
| Accesibilidad | Auditoría WCAG 2.1 AA | 0 fallos |

---

## 6. Riesgos y mitigación

| Riesgo | Mitigación |
|---|---|
| Sobreingeniería: AXIS se vuelve "Jira" | Cada feature paga su complejidad con valor medible. Templates simples, no DSL |
| Migración rompe estado existente | Schema versionado + migración soft en `useLocalStorage` |
| Rebrand confunde a usuarios actuales | Conservar alias `nexus-*` durante 2 sprints |
| Diseño moderno sacrifica densidad táctica | Density modes — Compact preserva el feel HUD |

---

## Anexos
- ADR-001: Rebrand AXIS (aprobado)
- ADR-002 (pendiente): Modelo de datos v4 con Sprints + OKRs
- ADR-003 (pendiente): Sistema de tokens v4 (elevación, semantic scales)
