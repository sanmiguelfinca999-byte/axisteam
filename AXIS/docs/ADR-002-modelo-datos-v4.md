# ADR-002: Modelo de datos v4 — Sprints, OKRs y Dependencies

- **Estado:** Aprobado — implementación en curso
- **Fecha:** 2026-06-12
- **Decisores:** Hannah (Product Owner)
- **Versión afectada:** 3.0.0 → 4.0.0

## Contexto

AXIS v3 modela exclusivamente Missions con Activos. Esto cubre la operación táctica pero no materializa el marco ágil que el reposicionamiento "Execution OS" promete. Para vender AXIS como sistema de garantía de ejecución, el modelo debe incluir:

1. **Sprints** — el contenedor temporal del trabajo
2. **Objectives + Key Results** — el contenedor estratégico
3. **Dependencies** — el grafo de bloqueos entre misiones

Sin estos primitivos, no se pueden construir las features de productividad (Capacity), rituales (Daily Pulse, Retro) ni inteligencia (Velocity, Burndown) del roadmap v4.

## Decisión

### Entidades nuevas

```ts
type Sprint = {
  id: string                  // 'SP-2026-Q3-W1'
  nombre: string              // 'Sprint 24'
  goal: string                // 'Cerrar onboarding del cliente Kestrel'
  fechaInicio: string         // ISO
  fechaFin: string            // ISO
  estado: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'
  retro?: {                   // se llena al cerrar
    funciono: string[]
    fallo: string[]
    notas: string
    velocity: number
  }
}

type Objective = {
  id: string                  // 'OBJ-Q3-01'
  titulo: string
  descripcion: string
  periodo: string             // 'Q3-2026'
  ownerId: string             // activoId del responsable
  estado: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  fechaCreacion: string
}

type KeyResult = {
  id: string                  // 'KR-Q3-01-A'
  objectiveId: string
  titulo: string
  metrica: string             // texto: 'MTTR', 'NPS', 'Cobertura'
  target: number
  current: number
  unit: string                // '%', 'h', 'pts', 'count'
  trend: 'UP' | 'DOWN'        // dirección deseada (UP = más es mejor)
}
```

### Extensión de Mission

```ts
type Mission = {
  // ...campos existentes...
  sprintId?: string | null         // misión asignada a un sprint
  keyResultId?: string | null      // misión vinculada a un KR
  bloqueaA: string[]               // tareas que esta misión bloquea
  bloqueadaPor: string[]           // tareas que bloquean esta misión
  storyPoints?: number             // estimación esfuerzo (Fibonacci: 1, 2, 3, 5, 8, 13)
  eventos: Event[]                 // ya existente en v3.1
  comentarios?: never              // los comentarios viven dentro de eventos.tipo=COMMENT
}
```

### Persistencia y migración soft

Nuevas claves en localStorage:

| Clave | Tipo |
|---|---|
| `axis_sprints` | `Sprint[]` |
| `axis_objectives` | `Objective[]` |
| `axis_key_results` | `KeyResult[]` |
| `axis_schema_version` | `string` ('v4.0.0') |
| `nexus_tasks` (conservada) | `Mission[]` extendido |

**Estrategia de migración:** al boot, el provider lee `axis_schema_version`. Si no existe o es `<v4`, ejecuta `migrateToV4()`:
1. Para cada tarea en `nexus_tasks`: agrega defaults `sprintId: null, keyResultId: null, bloqueaA: [], bloqueadaPor: [], storyPoints: null` si faltan.
2. Si `axis_sprints` está vacío, siembra un sprint ACTIVE seed.
3. Si `axis_objectives` está vacío, siembra un Objective demo con 3 KRs.
4. Escribe `axis_schema_version = 'v4.0.0'`.

Esto preserva todo dato existente del usuario sin pérdida.

### API nueva en el provider

```ts
// Sprints
sprints: Sprint[]
sprintActivo: Sprint | null
crearSprint(nombre, goal, dias) → Sprint
cerrarSprint(sprintId, retroData) → void
vincularMisionASprint(tareaId, sprintId | null) → void

// OKRs
objectives: Objective[]
keyResults: KeyResult[]
crearObjective(titulo, descripcion, periodo, ownerId) → Objective
agregarKR(objectiveId, titulo, metrica, target, unit, trend) → KeyResult
actualizarKR(krId, current) → void
vincularMisionAKR(tareaId, krId | null) → void

// Dependencies
agregarDependencia(tareaA_id, tareaB_id) → void  // A bloquea B
quitarDependencia(tareaA_id, tareaB_id) → void
obtenerCadenaDeBloqueo(tareaId) → Mission[]      // BFS aguas arriba
```

## Consecuencias

### Aplicado ahora (sprint A1)
- ADR escrito
- Modelo de datos en seedData v4
- Provider con migración soft + helpers CRUD + sprintActivo memoizado
- UI mínima de visualización ya integrada en componentes existentes (chips de Sprint + KR en MisionCard y ActivoCard, sin reescritura masiva)
- Terminología migrada: Coronel → Director, Activo → Operator, Protocolo Charlie → Re-route Protocol, etc.

### Pendiente — Sprint A1.5
- OKR Tree view (visualización jerárquica)
- Sprint Selector dropdown en topbar
- Sprint Goal banner persistente
- Cmd+K command palette

### Pendiente — Sprint A2
- Capacity Planning view (heatmap)
- Visualizador de dependencias (grafo)
- Density modes

### Riesgo controlado
La migración soft preserva datos del MVP. Si fallara, ErrorBoundary captura y permite reset manual del localStorage. No hay cambios destructivos en el shape de `Mission` — solo adiciones opcionales.

## Referencias
- Doerr, John. *Measure What Matters* (OKRs).
- Standish Group CHAOS Report 2023 (60% retrasos por dependencias).
- Atlassian "State of Teams" 2024 (50% desperdicio standups síncronos).
