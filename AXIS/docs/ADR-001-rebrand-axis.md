# ADR-001: Rebrand de NEXUS Command Center a AXIS — Mission Control

- **Estado:** Aprobado — implementación parcial (rebrand textual)
- **Fecha:** 2026-06-11
- **Decisores:** Hannah (Product Owner)
- **Versión afectada:** 2.0.0 → 3.0.0

## Contexto

El sistema operaba como "NEXUS Command Center" con identidad militar/espionaje pesada (Coronel, Activo, Protocolo Charlie, Agente Vigía, SIR). El lenguaje funcionaba narrativamente pero limitaba el mercado direccionable a defensa y seguridad, dejando fuera operaciones corporativas, agencias, equipos remotos distribuidos y ONGs grandes — segmentos donde el producto técnicamente encaja sin cambios.

Auditoría arquitectónica encontró el código en buen estado tras la integración del Módulo 4 (single context, RBAC enforced en render, separación limpia por dominio). El cuello de botella no era técnico sino de posicionamiento de marca.

## Decisión

Renombrar el sistema a **AXIS — Mission Control for Modern Teams**.

### Por qué AXIS sobre las alternativas

| Candidato | Pro | Contra | Veredicto |
|---|---|---|---|
| ORBIT | Metáfora clara hub-and-spoke (Director + 11 Operators) | Suena más "cosmos" que "control" | Descartado por el PO |
| **AXIS** | Eje de rotación, alianza, autoridad central; corto | Riesgo histórico (axis powers) en mercado USA | **Aceptado** |
| Conservar NEXUS | Cero costo | No resuelve el problema de posicionamiento | Descartado |
| HELIX / VANGUARD / NORTH | Variadas | Menos memorables o ya saturados | Descartados |

### Terminología nueva (referencia, aplicación gradual)

| NEXUS (legacy) | AXIS (target) |
|---|---|
| Coronel | Director |
| Activo | Operator / Agente |
| Agente Vigía | PulseAI |
| Agente Estratega | RouteAI |
| Agente Enlace | BriefAI |
| Protocolo Charlie | Re-route Protocol |
| SIR | Mission Brief |
| Focus Mode | My Axis |
| HUD | Command View |

### Paleta visual nueva — "Deep Space"

Inyectada como tokens `axis-*` en `tailwind.config.js`. Los tokens `nexus-*` se conservan como alias legacy para migración progresiva sin romper componentes existentes.

```
axis-void   #06091F  fondo
axis-deep   #0D1438  superficie
axis-edge   #1F2A5E  bordes
axis-text   #E8ECFF
axis-dim    #7A8AB8
axis-glow   #5B8DEF  primary
axis-pulse  #00D9FF  acentos
axis-flare  #FF5470  crisis
axis-solar  #FFB547  warning
axis-leaf   #22D3A8  ok
```

## Consecuencias

### Aplicado ahora (sprint 2026-06-11)

- `package.json` → `axis-command-center@3.0.0`
- `index.html` → `AXIS — Mission Control`
- Topbar → marca "AXIS" + tagline "Mission Control"
- LoginScreen → logo "AXIS" + tagline + corner decoration
- Tokens `axis-*` agregados a Tailwind sin remover `nexus-*`
- Animación `orbit` (60s/vuelta) disponible para uso futuro en logo

### Pendiente — sprints siguientes

1. **Renombrado interno del código**: archivos `NEXUSContext`, `useNEXUS`, etc. siguen en su nombre legacy. Migrar requerirá renombres masivos + actualización de imports. Decisión: hacerlo en un solo PR atómico cuando se decida.
2. **Migración de tokens en componentes**: actualmente los componentes usan `nexus-*`. Migrar componente por componente a `axis-*` conforme se toquen.
3. **Terminología de dominio**: Coronel → Director, etc. no se aplicó porque tiene implicaciones de copy en todo el árbol (incluyendo SIRs generados, notificaciones, ModalCrisis, etc.). Diferido a sprint dedicado de copywriting.
4. **Logo orbital animado**: pendiente de diseño definitivo (concepto: 11 nodos orbitando un centro pulsante).
5. **Activos en seedData**: los codenames militares (PHANTOM, CIPHER, NOVA…) son brand-neutral y se conservan tal cual.

### Riesgo controlado

Mantener `nexus-*` como alias evita un big-bang rebrand que rompería la app. La estrategia es **migración progresiva**: cada PR futuro que toque un componente aprovecha para migrar sus clases de `nexus-*` a `axis-*`. Cuando el grep de `nexus-` en `src/` devuelva cero, se retiran los alias.

## Referencias

- Briefing original de auditoría — sesión 2026-06-11
- Memoria del proyecto: `project_brand_decision.md`
