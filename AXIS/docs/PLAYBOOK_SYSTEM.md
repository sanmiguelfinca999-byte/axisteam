# AXIS — Sistema adaptativo de Playbooks

Subsistema que convierte un Diagnóstico del usuario en un Execution OS personalizado. Tres archivos forman el sistema:

```
src/components/onboarding/OnboardingDiagnostic.jsx  # Wizard de captura
src/lib/playbookEngine.js                            # Motor de matching + despliegue
src/data/playbooks.js                                # Catálogo de Playbooks
```

## Flujo end-to-end

```
[Usuario hace login sin playbook persistido]
        ↓
[NEXUSContext: needsOnboarding === true]
        ↓
[App.jsx renderiza <OnboardingDiagnostic />]
        ↓
[Usuario completa 7 pasos → wizard llama deployPlaybook(diagnostico)]
        ↓
[Motor: matchPlaybook → playbook.generarObjective/KRs/misiones]
        ↓
[Preview en pantalla → usuario confirma]
        ↓
[onComplete(deployment) → context.applyPlaybook(deployment)]
        ↓
[deploymentToEntities → asigna IDs → persiste en localStorage o Supabase]
        ↓
[setUserPlaybook → needsOnboarding === false]
        ↓
[App renderiza la vista normal con datos reales del usuario]
```

## Schema de un Playbook

```js
{
  id: string,                  // 'founder-business' | ...
  nombre, descripcion: string,
  metodologia: string,         // ej: 'OKR + Lean experiments'
  ciclo: 'semanal'|'quincenal'|'mensual',
  vistaHUD: 'pipeline'|'streak'|'multi-track'|'standard',
  ritualSemanal: { dia, hora, tipo, duracionMin },
  consejosClave: string[],     // 2-3 principios operativos
  generarObjective: (diagnostic) => { titulo, descripcion, periodo },
  generarKRs:       (diagnostic) => [{ titulo, metrica, target, current, unit, trend }],
  generarMisionesIniciales: (diagnostic) => [{ titulo, descripcion, prioridad, diasLimite, storyPoints?, keyResultId? }],
}
```

**Las funciones generadoras son puras** — reciben el diagnóstico y devuelven datos. No tocan estado externo. Esto las hace testeables y predecibles.

## Catálogo actual (`data/playbooks.js`)

| id | Dominio | Ciclo | Vista |
|---|---|---|---|
| `founder-business` | Founder / Negocio | quincenal | pipeline |
| `habits-health` | Hábitos / Salud personal | semanal | streak |
| `admin-multifaceted` | Administración / Multi-frente táctico | semanal | multi-track |
| `custom-okr` | Fallback OKR estándar | quincenal | standard |

### Heurística de matching

```
1. Match directo por dominio explícito del diagnóstico (DOMAIN_TO_PLAYBOOK)
2. Si no, regex sobre meta: /cliente|venta|mrr.../ → founder, etc.
3. Fallback: custom-okr
```

Ver `lib/playbookEngine.js::matchPlaybook()`.

## Diagnóstico (7 pasos)

```
1. dominio       → enum (founder | habits | admin | custom)
2. meta          → string libre + horizonteMeses (1|3|6|12)
3. porQue        → texto largo
4. medicion      → enum (numerico | hito | cualitativo)
5. tiempoSemana  → enum ('< 3 h' | '3 a 7 h' | '8 a 14 h' | '15 a 25 h' | '> 25 h')
6. frenos        → array (metodo|claridad|disciplina|tiempo|recursos|miedo)
7. modo          → enum (solo | squad)
```

El diagnóstico SE GUARDA EN `userPlaybook.diagnostico` para futura reutilización (ej. ajustes posteriores).

## API del motor

### `matchPlaybook(diagnostic) → playbook`
Selecciona el playbook adecuado. Determinista. Sin side effects.

### `deployPlaybook(diagnostic) → Deployment`
Estructura:
```js
{
  playbook: { id, nombre, vistaHUD, ciclo, ritualSemanal },
  objective: { titulo, descripcion, periodo },
  krs:       [{ titulo, metrica, target, current, unit, trend }],
  misiones:  [{ titulo, descripcion, prioridad, diasLimite, storyPoints, keyResultId }],
  meta:      { diagnostico, generadoEn, consejosClave, metodologia },
}
```
Aún sin IDs. Listo para preview.

### `deploymentToEntities(deployment, ownerId, sprintId) → { objective, krs, misiones }`
Asigna IDs y convierte a las entidades reales que entiende el `NEXUSContext`. Asocia las misiones al primer KR por defecto. Asigna fechas absolutas a partir de `diasLimite` relativos.

### `PLAYBOOK_OPTIONS`
Array `{ id, label, hint }` consumido por el wizard en el paso "Dominio".

## Integración con el Context

`NEXUSContext.jsx` expone:

```js
{
  userPlaybook,           // null o el playbook activo persistido
  axisMode,               // 'solo' | 'squad'
  setAxisMode(modo),
  applyPlaybook(deployment, ownerIdOpcional?),
  resetPlaybook(),
  needsOnboarding,        // bool: true si no hay playbook y estás en local mode
}
```

`applyPlaybook` es **idempotente por overwrite** — al desplegar otra vez, reemplaza `objectives`, `keyResults`, `tasks` en local. En cloud hace upsert (no borra los previos automáticamente). Para reset completo, usar `resetPlaybook()` y `applyPlaybook(nuevoDeployment)`.

## Cómo agregar un Playbook nuevo (10 min)

1. En `data/playbooks.js`, crea el objeto siguiendo el schema:
   ```js
   const atletaPlaybook = {
     id: 'atleta-deportista',
     nombre: 'Atleta / Deportista',
     descripcion: 'Periodización + recuperación + métricas físicas',
     metodologia: 'Block periodization (Issurin) + RPE-based load',
     ciclo: 'semanal',
     vistaHUD: 'multi-track', // o crear 'training-load'
     ritualSemanal: { dia: 'domingo', hora: '20:00', tipo: 'planning', duracionMin: 30 },
     consejosClave: ['...', '...', '...'],
     generarObjective: (d) => ({ ... }),
     generarKRs:       (d) => [ kr(...), kr(...) ],
     generarMisionesIniciales: (d) => [ makeMission(...), ... ],
   }
   ```

2. Añádelo al array `PLAYBOOKS` exportado.

3. En `lib/playbookEngine.js`:
   - Añade entry a `DOMAIN_TO_PLAYBOOK` si tiene dominio explícito en el wizard
   - Añade regex a `matchPlaybook` heurística si querés capturar metas de texto libre
   - Añade entry a `PLAYBOOK_OPTIONS` para que aparezca en el paso 1 del wizard

4. (Opcional) Si necesita una `vistaHUD` nueva, crea el componente y conéctalo en `App.jsx` (ver ROADMAP — Ola 3).

5. Smoke test: borrar localStorage → login → diagnóstico → elegir el nuevo dominio → verificar despliegue.

## Buenas prácticas

- **Generadores deben ser pequeños y predecibles.** Si un generador tiene >50 líneas, probablemente el playbook abarca demasiados sub-dominios.
- **Las misiones sugeridas son EDITABLES.** El usuario las puede borrar/modificar. No las hagas dependientes entre sí con cadenas largas — usa `bloqueaA / bloqueadaPor` con criterio.
- **Los KRs deben ser numéricos.** El motor calcula `progresoMetrica` asumiendo `current/target`. Evita KRs binarios — para esos usa misiones críticas.
- **`storyPoints` siguen Fibonacci** (1, 2, 3, 5, 8, 13). Si dudas, 3 (medio día) o 5 (1-2 días) suelen ser correctos.
- **Consejos clave son 2-3 frases**, no manifiestos. Aparecen en el preview y deben caber sin scroll.
- **No metas plantillas verbose en seedData.js.** Los playbooks son el lugar correcto — `seedData.js` es solo para demos del Squad Mode con 11 Members.

## Tests sugeridos (no implementados aún)

```js
// playbookEngine.test.js
describe('matchPlaybook', () => {
  it('matches by explicit dominio', () => {
    expect(matchPlaybook({ dominio: 'founder-business' }).id).toBe('founder-business')
  })
  it('falls back to custom-okr', () => {
    expect(matchPlaybook({}).id).toBe('custom-okr')
  })
  it('heuristic on meta wins when dominio missing', () => {
    expect(matchPlaybook({ meta: 'Bajar a 10.8 en 100m' }).id).toBe('habits-health')
  })
})

describe('deployPlaybook', () => {
  it('returns valid Deployment shape', () => {
    const d = deployPlaybook({ dominio: 'admin-multifaceted', tracks: ['Op', 'Estrategia'] })
    expect(d.objective.titulo).toBeTruthy()
    expect(d.krs.length).toBeGreaterThan(0)
    expect(d.misiones.length).toBeGreaterThan(0)
  })
})
```
