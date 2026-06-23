# AXIS — Catálogo de Playbooks

Cada Playbook es un **Execution OS personalizado** que AXIS despliega tras el Diagnóstico de 7 pasos. Define: metodología base, cadencia de revisión (`ciclo`), vista HUD adaptada (`vistaHUD`), ritual semanal, KRs por defecto sensibles al contexto y misiones iniciales editables.

El motor de matching es `src/lib/playbookEngine.js`. Heurística de scoring multi-dimensional (0–100):

| Señal | Peso | Origen |
|---|---|---|
| Dominio explícito | 50 | `diagnostic.dominio` |
| Keyword en `meta` | 25 | `SIGNALS[id].metaKeywords` |
| Frenos compatibles | 10 | `SIGNALS[id].frenosBias` |
| Tiempo semanal en rango | 10 | `SIGNALS[id].tiempoMin/Max` |
| Tipo de medición compatible | 5 | `SIGNALS[id].medicionPref` |

`explainPlaybookMatch(diagnostic, 3)` devuelve los top-3 con razones — base para mostrar transparencia en el preview del onboarding.

---

## Resumen del catálogo (13 playbooks)

| # | id | nombre | Ciclo | vistaHUD | Ritual semanal |
|---|---|---|---|---|---|
| 1 | `founder-business` | Founder / Negocio | quincenal | pipeline | lunes 09:00 (45 min planning) |
| 2 | `habits-health` | Hábitos / Salud personal | semanal | streak | domingo 19:00 (20 min) |
| 3 | `admin-multifaceted` | Administración / Multifacético | semanal | multi-track | viernes 17:00 (60 min review) |
| 4 | `atleta-deportista` | Atleta / Deportista | semanal | streak | domingo 20:00 (30 min) |
| 5 | `estudiante-examen` | Estudiante / Examen | semanal | streak | domingo 18:00 (30 min) |
| 6 | `creador-output` | Creador / Output creativo | semanal | multi-track | viernes 17:00 (45 min review) |
| 7 | `carrera-profesional` | Carrera / Profesional | quincenal | standard | viernes 17:00 (45 min review) |
| 8 | `padres-crianza` | Padres / Crianza activa | semanal | multi-track | domingo 20:00 (25 min) |
| 9 | `investigador-tesis` | Investigador / Tesis | semanal | streak | viernes 17:00 (45 min review) |
| 10 | `disenador-output` | Diseñador / Output visual | semanal | multi-track | viernes 17:00 (30 min review) |
| 11 | `idioma-fluido` | Idioma / Fluidez extranjera | semanal | streak | domingo 19:00 (25 min) |
| 12 | `pareja-relacion` | Pareja / Relación | semanal | standard | domingo 17:00 (40 min review) |
| 13 | `custom-okr` | Custom (OKR estándar) | quincenal | standard | lunes 09:00 (30 min planning) |

---

## Detalle por playbook

### 1. `founder-business` — Founder / Negocio
**Metodología:** OKR (Doerr) + Lean experiments (Ries) + Deep Work blocks (Newport).
**Vista HUD:** `pipeline` (columnas Discovery → Demo → Trial → Cierre → Ganadas).
**Signals — keywords:** `cliente`, `venta`, `mrr`, `revenue`, `startup`, `founder`, `negocio`, `empresa`, `saas`, `tracción`, `cerrar`, `pricing`, `gtm`, `pmf`.
**Frenos bias:** claridad · tiempo. **Tiempo:** 8–60 h/sem. **Medición preferida:** numérico.
**KRs adaptativos:** según meta detecta clientes / MRR / lanzamiento; siempre añade *Sesiones Deep Work/semana*.

### 2. `habits-health` — Hábitos / Salud personal
**Metodología:** Atomic Habits (Clear) + BJ Fogg Tiny Habits + Implementation Intentions.
**Vista HUD:** `streak`.
**Signals — keywords:** `hábito`, `salud`, `ejercicio`, `peso`, `sueño`, `medita`, `correr`, `mindful`, `fitness`, `gym`, `yoga`, `dieta`, `paz interior`.
**Frenos bias:** disciplina · miedo. **Tiempo:** 1–25 h/sem.
**KRs adaptativos:** ramas según meta (correr / fitness / meditación / sueño / hábito genérico).

### 3. `admin-multifaceted` — Administración / Multifacético
**Metodología:** Eisenhower matrix + GTD Weekly Review + OODA loop.
**Vista HUD:** `multi-track`.
**Signals — keywords:** `equipo`, `gerente`, `director`, `admin`, `coordin`, `multipl`, `frente`, `track`, `operaciones`, `cargo`, `empresa familiar`, `pyme`, `ong`.
**Frenos bias:** tiempo · método. **Tiempo:** 15–80 h/sem. **Medición:** hito · cualitativo.
**Particularidad:** consume `diagnostic.tracks` (array) para generar KRs y misiones por frente. Si no hay tracks, defaults a `['Operación', 'Estrategia', 'Personas']`.

### 4. `atleta-deportista` — Atleta / Deportista
**Metodología:** Block periodization (Issurin) + RPE-based load (Helms) + Polarized training (Seiler).
**Vista HUD:** `streak`. **Frenos bias:** disciplina. **Tiempo:** 5–30 h/sem.
**Signals — keywords:** `maratón`, `fondo`, `10k`, `21k`, `42k`, `trail`, `powerlift`, `sentadilla`, `deportista`, `atleta`, `pr`, `crossfit`, `triatlón`, `natación`, `ciclismo`, `escalada`, `musculación`, `hipertrofia`.
**KRs adaptativos:** ramas correr / fuerza / genérica; siempre añade horas de sueño y días sin sobrecarga (RPE ≤ 8).

### 5. `estudiante-examen` — Estudiante / Examen
**Metodología:** Spaced repetition (Ebbinghaus, Anki) + Active recall (Roediger) + Interleaving (Bjork).
**Vista HUD:** `streak`. **Frenos bias:** disciplina · método. **Tiempo:** 8–60 h/sem.
**Signals — keywords:** `examen`, `tesis`, `certificación`, `toefl`, `gre`, `mcat`, `usmle`, `oposición`, `estudio`, `grado`, `maestría`, `posgrado`, `cohort`.
**KRs:** tarjetas Anki creadas, sesiones recall/semana, simulacros cronometrados, score promedio.

### 6. `creador-output` — Creador / Output creativo
**Metodología:** Show Your Work (Kleon) + Deep Work + Build in Public + Compound publishing.
**Vista HUD:** `multi-track`. **Tiempo:** 3–25 h/sem.
**Signals — keywords:** `podcast`, `youtube`, `newsletter`, `blog`, `crear`/`creador`, `publica`, `content`, `tiktok`, `reels`, `article`, `video`, `audiencia`, `creator`.
**KRs adaptativos:** ramas video / escritura / podcast / genérica + sesiones Deep Work + consistencia de cadencia.

### 7. `carrera-profesional` — Carrera / Profesional
**Metodología:** OKR personal + Skill stacking (Adams) + Strategic networking (Ferrazzi) + Levels framework.
**Vista HUD:** `standard`. **Tiempo:** 5–40 h/sem. **Medición:** hito · cualitativo.
**Signals — keywords:** `promoción`, `ascenso`, `nivel`, `senior`, `principal`, `carrera`, `skip`, `mentor`, `brag`, `cv`, `linkedin`, `networking`, `cargo nuevo`, `director`, `gerente`, `head`.
**KRs:** outcomes visibles, skip-levels, conversaciones de networking estratégico, libros/cursos.

### 8. `padres-crianza` — Padres / Crianza activa
**Metodología:** Authoritative parenting (Baumrind) + Conscious Parenting (Tsabary) + Repair > Perfection (Siegel).
**Vista HUD:** `multi-track`. **Tiempo:** 3–30 h/sem.
**Signals — keywords:** `padre`, `madre`, `hijo`, `hija`, `crianza`, `familia`, `parental`, `escuela`, `adolescente`, `niño`, `niña`, `paternidad`, `maternidad`.
**KRs:** rituales 1-a-1/semana, cenas sin pantallas, conversaciones de pareja sin logística, días de autocuidado del cuidador.

### 9. `investigador-tesis` — Investigador / Tesis doctorado
**Metodología:** Writing daily (Boice) + Lit review sistemático (PRISMA) + Pomodoro profundo (Cirillo + Newport).
**Vista HUD:** `streak`. **Tiempo:** 10–60 h/sem.
**Signals — keywords:** `tesis`, `doctoral`, `paper`, `investigación`, `phd`, `máster`, `capítulo`, `publicación académica`, `lit review`, `director de tesis`.
**KRs:** días con sesión de escritura, palabras/semana, papers fichados, reuniones con director.

### 10. `disenador-output` — Diseñador / Output visual
**Metodología:** Daily UI (Andersen) + Critique-driven iteration + Portfolio compounding.
**Vista HUD:** `multi-track`. **Tiempo:** 5–30 h/sem.
**Signals — keywords:** `diseño`, `ui`, `ux`, `portfolio`, `figma`, `illustration`, `ilustración`, `brand`, `marca`, `case study`, `moodboard`, `design`, `product designer`.
**KRs:** piezas publicadas/semana, iteraciones documentadas por pieza, sesiones de critique, casos nuevos en portfolio.

### 11. `idioma-fluido` — Idioma / Fluidez extranjera
**Metodología:** Comprehensible Input (Krashen) + Spaced Repetition (Anki) + Production-based fluency (Lyster).
**Vista HUD:** `streak`. **Tiempo:** 3–25 h/sem.
**Signals — keywords:** `inglés`, `francés`, `alemán`, `italiano`, `portugués`, `japonés`, `chino`, `mandarín`, `coreano`, `ruso`, `idioma`, `lengua`, `fluidez`, `c1`, `b2`, `toefl`, `delf`, `dele`.
**KRs:** días con input, minutos acumulados, sesiones output partner, tarjetas Anki revisadas.

### 12. `pareja-relacion` — Pareja / Relación de largo plazo
**Metodología:** Gottman 4 Horsemen / Magic 5 Hours + Bid responses + State of the Union ritual.
**Vista HUD:** `standard`. **Tiempo:** 1–20 h/sem. **Medición:** cualitativo · hito.
**Signals — keywords:** `pareja`, `esposo`, `esposa`, `matrimonio`, `novia`, `novio`, `relación`, `conexión`, `state of`, `gottman`, `couple`, `amor`.
**KRs:** SOTU semanales, rituales sin pantallas, apreciaciones verbalizadas, conflictos cerrados con reparación.

### 13. `custom-okr` — Custom (OKR estándar)
**Metodología:** OKR (Doerr) + Scrum-lite.
**Vista HUD:** `standard`. **Sin keywords** (no matchea por meta — gana sólo por baseline +1 si nadie más responde).
**KRs:** 3 genéricos (KR 1/2/3) que el usuario debe rellenar después.
**Cuándo se elige:** dominio explícito `custom` o cuando ningún otro playbook supera 0 puntos.

---

## Decisiones de diseño

- **Generadores puros:** `generarObjective`, `generarKRs`, `generarMisionesIniciales` son funciones puras del diagnóstico. Testeables sin React.
- **Misiones editables:** lo que el playbook genera son sugerencias iniciales. El usuario puede modificar, eliminar o reemplazar libremente.
- **KRs numéricos preferidos:** evita KRs binarios — para esos usa misiones críticas.
- **storyPoints en Fibonacci:** 1, 2, 3, 5, 8, 13. Sugerencias del playbook se mantienen en este rango.
- **Consejos clave en 2-3 frases:** principios operativos visibles en el preview. Sin manifiestos.
- **`custom-okr` no matchea por meta:** evita ser un mal default que ahoga a los otros playbooks (bug detectado por tests).

---

## Cómo añadir un Playbook nuevo

1. En `src/data/playbooks.js`, define el objeto siguiendo el schema. Apóyate en algún playbook existente como base.
2. Añade el objeto al array `PLAYBOOKS` exportado.
3. En `src/lib/playbookEngine.js`:
   - Entry en `DOMAIN_TO_PLAYBOOK`
   - Bloque en `SIGNALS` con regex de keywords + bias de frenos + rango horario + medición preferida
   - Entry en `PLAYBOOK_OPTIONS` (visible en el wizard)
4. (Opcional) Si el dominio requiere una vista HUD propia, créala en `src/components/hud/playbook-views/` y registra el mapping en `App.jsx::HUD_BY_VISTA`.
5. Tests: añade casos en `src/lib/__tests__/playbookEngine.test.js` para validar el matching.
6. Smoke test: borra `axis_user_playbook` en localStorage → login → diagnóstico → elige el nuevo dominio → verifica que se despliega correctamente.

---

## Referencias

- Doerr, John. *Measure What Matters* (OKRs).
- Clear, James. *Atomic Habits*.
- Fogg, BJ. *Tiny Habits*.
- Newport, Cal. *Deep Work*.
- Allen, David. *Getting Things Done*.
- Gottman, John. *The Seven Principles for Making Marriage Work*.
- Boice, Robert. *How Writers Journey to Comfort and Fluency*.
- Krashen, Stephen. *Input Hypothesis*.
- Issurin, Vladimir. *Block Periodization*.
