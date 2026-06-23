# AXIS — Roadmap priorizado

Olas pendientes ordenadas por impacto/esfuerzo. Cada una es independiente — se pueden hacer en cualquier orden, pero el orden propuesto maximiza el valor visible para el usuario.

---

## ✅ Olas completadas (3-11)

- **Ola 3** — Vistas HUD adaptadas por dominio (Pipeline, Streak, MultiTrack, Standard)
- **Ola 4** — Weekly Review automática con trigger por ritualSemanal
- **Ola 5** — Badge de streak en Topbar
- **Ola 6** — Catálogo de 13 Playbooks (de 4 originales a 13)
- **Ola 7** — SettingsView con export/import/reset
- **Ola 8** — Heurística v2: scoring multi-dimensional + explainPlaybookMatch
- **Ola 9** — `insights` operativos + InsightsPanel
- **Ola 10** — Foco neurológico TDAH/TLP: NowMode + TimeBox flexible + MorningBrief + MissionCelebration + Empty states compasivos + prefers-reduced-motion
- **Ola 11** — Continuidad y captura: WelcomeBackBanner + SmartSuggestionsRow + QuickCapture + KeyboardShortcuts + Tests Vitest (53 specs)

Ver `HANDOFF.md` sección 4 para detalle de cada ola entregada.

---

## ⚠️ Histórico de Ola 3 (mantenido como referencia del proceso original)

## Ola 3 — Vistas HUD adaptadas por dominio ⭐ PRIORIDAD #1

**Por qué primero:** los Playbooks ya seleccionan una `vistaHUD` (`pipeline | streak | multi-track | standard`), pero el HUD nunca cambia. Esta ola conecta los datos del Playbook con la experiencia visual.

**Esfuerzo:** 1 sesión (~1.5-2 h).

**Cambios concretos:**

1. Crear `src/components/hud/playbook-views/`:
   - `PipelineHUD.jsx` — Para Founder/Negocio. Columnas Discovery → Demo → Trial → Cliente. Misiones agrupadas por estado.
   - `StreakHUD.jsx` — Para Hábitos/Salud. Calendario de 30-90 días con marca por día con misión completada. Streak más larga + actual.
   - `MultiTrackHUD.jsx` — Para Administración. Tracks horizontales tipo Kanban, cada uno con sus misiones. Permite ver desbalance entre frentes.
   - `StandardHUD.jsx` — Para Custom OKR. La vista actual (grid de cards) renombrada.

2. En `App.jsx`, función `CoronelHUD`:
   ```js
   const { userPlaybook } = useNEXUS()
   const vista = userPlaybook?.vistaHUD || 'standard'
   const ViewComp = { pipeline: PipelineHUD, streak: StreakHUD, 'multi-track': MultiTrackHUD, standard: StandardHUD }[vista]
   return <ViewComp />
   ```

3. En `FocusMode.jsx` (Solo Mode), aplicar el mismo switch para que la vista personal también se adapte.

4. Cada componente de vista DEBE:
   - Consumir solo `useNEXUS()` para datos.
   - Tener `<3 KB` gzip aprox.
   - Manejar gracefully el caso "sin misiones".
   - Permitir abrir el `ModalCrisis` / Re-route si aplica.

**Test manual:** completa el onboarding 4 veces (una por dominio) y verifica que la vista cambia.

---

## Ola 4 — Weekly Review automática

**Por qué:** cierra el loop OKR. Sin review, los KRs se mueven sin contexto.

**Esfuerzo:** 1 sesión.

**Cambios:**

1. Componente `src/components/review/WeeklyReviewModal.jsx`.
2. Trigger: `useEffect` que verifica `userPlaybook.ritualSemanal` vs `Date.now()`. Si toca día/hora del ritual y `localStorage['axis_last_review']` < 24h atrás, abre modal.
3. Estructura del modal:
   - **Recap**: misiones completadas última semana, % avance por KR, streak actual.
   - **Stuck**: misiones sin movimiento en >5 días.
   - **Planning**: 3 inputs para "tus 3 misiones de la próxima semana" (atajo a crear misiones).
   - **Cierre**: persiste un registro en `axis_review_log` (array de `{ date, recap, planning }`).
4. Notificación discreta si se omite (no bloquear).

---

## Ola 5 — Streak / momentum

**Por qué:** refuerzo conductual barato, alto retorno emocional.

**Esfuerzo:** 30-45 min.

**Cambios:**

1. Computar `streak` en `NEXUSContext`:
   ```js
   const streak = useMemo(() => {
     // Contar días consecutivos hacia atrás con ≥1 misión completada
   }, [tasks])
   ```
2. Mostrar badge en `Topbar` (entre nav y user info): `🔥 12 días`.
3. Si streak ≥ 7, agregar resaltado dorado (color `axis-solar`).
4. Si streak == 0, no mostrar nada (no presión negativa).

---

## Ola 6 — Más Playbooks

**Esfuerzo:** ~10-15 min por playbook (siguiendo `PLAYBOOK_SYSTEM.md`).

Playbooks sugeridos (en orden de demanda esperada):

- **Atleta / Deportista** — ya bocetado, pendiente: periodización por bloques, RPE-based load, KRs: sesiones/semana + marca objetivo + minutos recuperación.
- **Estudiante / Examen** — Anki spaced repetition, simulacros semanales, KRs: tarjetas creadas, % retención por área, simulacros con score.
- **Creador / Output Creativo** — sesiones de output, deep work blocks, KRs: piezas publicadas, % consistencia de cadencia.
- **Carrera / Profesional** — performance reviews trimestrales, networking, KRs: reuniones de skip-level, libros/cursos completados.

Cada uno requiere:
1. Añadir objeto playbook a `data/playbooks.js`
2. Entry en `DOMAIN_TO_PLAYBOOK` y `PLAYBOOK_OPTIONS` en `lib/playbookEngine.js`
3. Regex heurística para captura por texto libre
4. (Si lo requiere) vista HUD propia — pero la mayoría puede reusar `streak` o `multi-track`

---

## Ola 7 — Settings

**Esfuerzo:** 45 min.

Crear `src/components/settings/SettingsView.jsx` con secciones:

- **Tu Playbook**: muestra el actual, botón "Rehacer diagnóstico" → `resetPlaybook()` + reset onboarding flag.
- **Modo**: toggle Solo ↔ Squad (advertencia: cambiar modo no transfiere datos automáticamente).
- **Tema**: dark/light (ya existe, mover de topbar).
- **Reset total**: borrar todo `localStorage` con confirmación 2-step.
- **Export/Import**: descargar JSON del estado, cargar JSON. Útil para backup y migración entre dispositivos.

Acceso: nuevo icono en topbar (`Settings` de lucide-react) o en command palette.

---

## Ola 8 — Sub-misiones (descomposición jerárquica)

**Por qué:** una misión "Cerrar 10 clientes" es vaga. El usuario querrá descomponerla en pasos.

**Esfuerzo:** 1-2 sesiones.

**Cambios:**

1. Modelo: añadir `parentId: string | null` al schema de Mission.
2. Mappers cloud: añadir `parent_id` a `missions` table (migración SQL).
3. UI: en `MissionComposer`, dropdown opcional "Sub-misión de:" con buscador.
4. Vista: en `ActivoDetail`, anidar visualmente las sub-misiones bajo su parent.
5. Algoritmo de progreso: `parent.progreso = avg(childrens.progreso)` opcional (configurable).

---

## Ola 9 — Migración a TypeScript progresiva

**Por qué:** seguridad de tipos. Pero NO es bloqueante.

**Esfuerzo:** 2-3 sesiones (puede dividirse).

**Estrategia:**

1. Renombrar `lib/playbookEngine.js` → `.ts`. Definir interfaces `Diagnostic`, `Playbook`, `Deployment`, `Mission`, etc.
2. Migrar `data/playbooks.js` → `.ts` con tipos del paso anterior.
3. Migrar componentes hoja primero (`ActivoCard`, `SIRBanner`), luego subir.
4. `NEXUSContext.jsx` al final — es el más complejo. Definir un tipo `NEXUSValue` que matchee el `value` exportado.
5. Configurar `tsconfig.json` con `allowJs: true, strict: true`.

**No migrar ahora** si los siguientes son más urgentes. TS suma complejidad sin features nuevas para el usuario.

---

## Ola 10 — Tests

**Esfuerzo:** 1-2 sesiones inicial + maintenance ongoing.

**Prioridad de cobertura:**

1. **Puros primero** (rápido, alto ROI):
   - `playbookEngine` — matching, deployment, conversion to entities.
   - `calcularSaludActivo` — todos los niveles de alertLevel.
   - `mappers` — round-trip snake↔camel.

2. **Componentes con context** (moderado):
   - `OnboardingDiagnostic` — flujo completo de 7 pasos + skip.
   - `ModalCrisis` — wizard 3 pasos del Re-route.
   - `FocusMode` — render con/sin misiones, Solo Mode vs Member.

3. **E2E con Playwright** (lento, mayor confianza):
   - Login → Onboarding → primer despliegue → completar 1 misión → verificar KR avanza.
   - Login → Squad Mode → forzar bloqueo → Re-route → verificar SIR recibido por el destinatario.

---

## Olas 12+ — Próximas mejoras propuestas

### Modo "Sin distracciones" en HUDs
Toggle global que oculta stats secundarias y deja solo la siguiente acción visible. Útil para perfiles que se distraen con la cantidad de información en pantalla.

### Daily Pulse async
30 s al cierre del día: "¿qué moviste hoy? ¿qué bloqueó?". Persiste como entry de `reviewLog` con `type: 'daily_pulse'`. Alimenta tendencias en Insights.

### Visual de energía por hora
Combinar `insights.energia` + hora del día para sugerir misiones livianas (mañana / tarde-noche) vs profundas (ventana productiva del usuario).

### Tests de componentes
Helper `renderWithProviders(component)` que envuelve en `NEXUSProvider`. Coverage de FocusMode, NowMode, MorningBrief, WelcomeBackBanner, QuickCapture, MissionCelebration, SmartSuggestionsRow, TimeBox.

### Audit a11y completo
Focus trap en modales (WeeklyReview, QuickCapture, KeyboardShortcuts, NowMode, Settings, MissionComposer). Contraste WCAG AA en todos los accents (gold streak, flare crítico, leaf green, purple welcome).

### Animación Framer Motion en transición HUD
Cuando el usuario cambia de Playbook desde Settings → animación entre la vista anterior y la nueva (fade-cross + ligero slide). Refuerza la sensación de "el sistema responde a tu intención".

### Documentación de Playbooks
`docs/PLAYBOOKS.md` con tabla de los 13 playbooks: metodología, ciclo, vistaHUD, ritualSemanal, KRs default, regex de matching, casos típicos.

---

## Pendientes de menor prioridad

- **Light mode CSS**: el toggle existe pero la paleta `nexus-bg/surface/text` no tiene variantes claras. Si se decide soportar light mode, hay que duplicar tokens.
- **i18n**: hoy todo en español. Si se internacionaliza, considerar `react-intl` o `i18next` con catálogos por idioma.
- **Mobile responsive**: el HUD grid funciona en móvil pero el ModalCrisis y MissionComposer son densos. Auditoría UX móvil pendiente.
- **PWA**: agregar service worker + manifest para instalación. Bajo esfuerzo, valor opcional.
- **Telemetría / Analytics**: hook para Plausible o PostHog. Privacidad-first.
- **AI assist** (opcional): integración Claude API para sugerir misiones a partir del Objetivo. Requiere API key del usuario.

---

## Bugs conocidos / mejoras técnicas

- ⚠️ `recordEvent` en mode local no agrega evento al `tarea.eventos` automáticamente (cada caller lo embebe manualmente). Refactor opcional: centralizar.
- ⚠️ `isCoronel === isDirector` (ambos exponen el mismo check). Redundancia menor, simplificable.
- ⚠️ `SIRBanner` filtra por `currentUser.role === 'CORONEL'` y oculta el banner. En Solo Mode no se ven Briefs (irrelevante, pero conceptualmente raro).
- ⚠️ En cloud mode, `sirs` está hardcoded a `[]` — los Mission Briefs en cloud no se cargan ni mantienen. Pendiente de implementar.
- ⚠️ El boot del context cloud carga TODAS las missions sin paginación. Si el dataset crece >1000, paginar.

---

## Cómo decidir qué hacer

**¿Es visible para el usuario en la próxima demo?** → Ola 3 / 5
**¿El usuario me lo pidió explícitamente?** → Hazlo primero (regla #1).
**¿Es deuda técnica que bloquea futuras features?** → revísala antes de añadir más capas.
**¿Es "nice to have" sin impacto inmediato?** → al final.
