-- ============================================================
-- AXIS v4 — RLS Policies (RBAC server-side)
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- Habilitar RLS en todas las tablas
alter table public.operators       enable row level security;
alter table public.sprints         enable row level security;
alter table public.objectives      enable row level security;
alter table public.key_results     enable row level security;
alter table public.missions        enable row level security;
alter table public.events          enable row level security;
alter table public.mission_briefs  enable row level security;
alter table public.notifications   enable row level security;

-- ============================================================
-- OPERATORS
-- ============================================================
drop policy if exists "operators_select_all"   on public.operators;
drop policy if exists "operators_update_self"  on public.operators;
drop policy if exists "operators_update_director" on public.operators;

create policy "operators_select_all" on public.operators
  for select using (auth.uid() is not null);

create policy "operators_update_self" on public.operators
  for update using (auth.uid() = id);

create policy "operators_update_director" on public.operators
  for update using (public.is_director());

-- ============================================================
-- SPRINTS — todos leen, solo Director escribe
-- ============================================================
drop policy if exists "sprints_select" on public.sprints;
drop policy if exists "sprints_write_director" on public.sprints;

create policy "sprints_select" on public.sprints
  for select using (auth.uid() is not null);

create policy "sprints_write_director" on public.sprints
  for all using (public.is_director()) with check (public.is_director());

-- ============================================================
-- OBJECTIVES — todos leen, solo Director escribe
-- ============================================================
drop policy if exists "obj_select" on public.objectives;
drop policy if exists "obj_write_director" on public.objectives;

create policy "obj_select" on public.objectives
  for select using (auth.uid() is not null);

create policy "obj_write_director" on public.objectives
  for all using (public.is_director()) with check (public.is_director());

-- ============================================================
-- KEY_RESULTS — todos leen; Director ALL; Operators pueden UPDATE current
-- ============================================================
drop policy if exists "kr_select" on public.key_results;
drop policy if exists "kr_write_director" on public.key_results;
drop policy if exists "kr_update_current" on public.key_results;

create policy "kr_select" on public.key_results
  for select using (auth.uid() is not null);

create policy "kr_write_director" on public.key_results
  for all using (public.is_director()) with check (public.is_director());

-- Operators pueden actualizar el `current` de KRs cuyo objetivo es de su autoría
-- (simplificado: por ahora permitimos a cualquier Operator actualizar current)
create policy "kr_update_current" on public.key_results
  for update using (auth.uid() is not null);

-- ============================================================
-- MISSIONS — pilar del RBAC
-- ============================================================
drop policy if exists "missions_select_director" on public.missions;
drop policy if exists "missions_select_own" on public.missions;
drop policy if exists "missions_write_director" on public.missions;
drop policy if exists "missions_update_own_progress" on public.missions;

-- Director ve TODAS
create policy "missions_select_director" on public.missions
  for select using (public.is_director());

-- Operator ve solo las suyas
create policy "missions_select_own" on public.missions
  for select using (operator_id = auth.uid());

-- Director CRUD completo
create policy "missions_write_director" on public.missions
  for all using (public.is_director()) with check (public.is_director());

-- Operator puede UPDATE solo progreso/estado de sus propias misiones
create policy "missions_update_own_progress" on public.missions
  for update using (operator_id = auth.uid())
  with check (operator_id = auth.uid());

-- ============================================================
-- EVENTS — visibilidad ligada a la mission
-- ============================================================
drop policy if exists "events_select_via_mission" on public.events;
drop policy if exists "events_insert_via_mission" on public.events;
drop policy if exists "events_insert_director" on public.events;

create policy "events_select_via_mission" on public.events
  for select using (
    public.is_director()
    or exists (
      select 1 from public.missions m
      where m.id = events.mission_id and m.operator_id = auth.uid()
    )
  );

create policy "events_insert_via_mission" on public.events
  for insert with check (
    public.is_director()
    or exists (
      select 1 from public.missions m
      where m.id = events.mission_id and m.operator_id = auth.uid()
    )
  );

-- ============================================================
-- MISSION_BRIEFS
-- Director ve todos; destino ve los suyos
-- ============================================================
drop policy if exists "briefs_select_director" on public.mission_briefs;
drop policy if exists "briefs_select_destino" on public.mission_briefs;
drop policy if exists "briefs_write_director" on public.mission_briefs;
drop policy if exists "briefs_update_leido" on public.mission_briefs;

create policy "briefs_select_director" on public.mission_briefs
  for select using (public.is_director());

create policy "briefs_select_destino" on public.mission_briefs
  for select using (destino_id = auth.uid());

create policy "briefs_write_director" on public.mission_briefs
  for all using (public.is_director()) with check (public.is_director());

create policy "briefs_update_leido" on public.mission_briefs
  for update using (destino_id = auth.uid());

-- ============================================================
-- NOTIFICATIONS — solo el dueño ve/modifica las suyas
-- ============================================================
drop policy if exists "notif_own" on public.notifications;
drop policy if exists "notif_director_insert" on public.notifications;

create policy "notif_own" on public.notifications
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "notif_director_insert" on public.notifications
  for insert with check (public.is_director());

-- ============================================================
-- FIN RLS.
-- Verificación recomendada: en SQL editor con dos jwts diferentes
-- (uno con role=DIRECTOR, otro con role=OPERATOR) confirmar que
-- los OPERATORs solo ven sus misiones.
-- ============================================================
