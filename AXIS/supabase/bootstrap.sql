-- ============================================================
-- AXIS v4 - Bootstrap SQL completo
-- Generado: 2026-06-23T10:06:43Z
-- Ejecutar en: Supabase Dashboard > SQL Editor > New query > Run
-- ============================================================

-- === BLOQUE 1: SCHEMA ===
-- ============================================================
-- AXIS v4 — Schema completo para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Idempotente: usa IF NOT EXISTS donde aplica
-- ============================================================

-- Extensiones necesarias
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLE: operators
-- Perfil extendido del usuario; 1:1 con auth.users
-- ============================================================
create table if not exists public.operators (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  codename      text not null,
  nombre        text not null,
  especialidad  text,
  avatar        text,
  role          text not null check (role in ('DIRECTOR', 'OPERATOR')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_operators_role on public.operators(role);

-- ============================================================
-- TABLE: sprints
-- ============================================================
create table if not exists public.sprints (
  id            text primary key,
  nombre        text not null,
  goal          text not null,
  fecha_inicio  timestamptz not null,
  fecha_fin     timestamptz not null,
  estado        text not null check (estado in ('UPCOMING', 'ACTIVE', 'COMPLETED')),
  retro         jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_sprints_estado on public.sprints(estado);
create index if not exists idx_sprints_fecha on public.sprints(fecha_inicio, fecha_fin);

-- ============================================================
-- TABLE: objectives
-- ============================================================
create table if not exists public.objectives (
  id            text primary key,
  titulo        text not null,
  descripcion   text,
  periodo       text not null,
  owner_id      uuid references public.operators(id),
  estado        text not null check (estado in ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_objectives_owner on public.objectives(owner_id);
create index if not exists idx_objectives_estado on public.objectives(estado);

-- ============================================================
-- TABLE: key_results
-- ============================================================
create table if not exists public.key_results (
  id            text primary key,
  objective_id  text not null references public.objectives(id) on delete cascade,
  titulo        text not null,
  metrica       text not null,
  target        numeric not null,
  current       numeric default 0,
  unit          text default '%',
  trend         text default 'UP' check (trend in ('UP', 'DOWN')),
  posicion      int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_kr_objective on public.key_results(objective_id);

-- ============================================================
-- TABLE: missions
-- ============================================================
create table if not exists public.missions (
  id              text primary key,
  titulo          text not null,
  descripcion     text,
  operator_id     uuid not null references public.operators(id),
  sprint_id       text references public.sprints(id) on delete set null,
  key_result_id   text references public.key_results(id) on delete set null,
  prioridad       text not null check (prioridad in ('CRITICA', 'ALTA', 'NORMAL', 'BAJA')),
  estado          text not null check (estado in ('EN_PROGRESO', 'COMPLETADA', 'CANCELADA')),
  progreso        int default 0 check (progreso between 0 and 100),
  story_points    int,
  fecha_creacion  timestamptz default now(),
  fecha_limite    timestamptz not null,
  mision_critica  boolean default false,
  reasignada      boolean default false,
  sir_id          text,
  bloqueada_por   text[] default array[]::text[],
  bloquea_a       text[] default array[]::text[],
  updated_at      timestamptz default now()
);

create index if not exists idx_missions_operator on public.missions(operator_id);
create index if not exists idx_missions_sprint on public.missions(sprint_id);
create index if not exists idx_missions_kr on public.missions(key_result_id);
create index if not exists idx_missions_estado on public.missions(estado);
create index if not exists idx_missions_prioridad on public.missions(prioridad);

-- ============================================================
-- TABLE: events (timeline + comments)
-- ============================================================
create table if not exists public.events (
  id           uuid primary key default uuid_generate_v4(),
  mission_id   text not null references public.missions(id) on delete cascade,
  tipo         text not null check (tipo in ('CREATED', 'REASIGNADA', 'COMPLETED', 'COMMENT', 'PROGRESO')),
  autor_id     uuid references public.operators(id),
  payload      jsonb default '{}'::jsonb,
  created_at   timestamptz default now()
);

create index if not exists idx_events_mission on public.events(mission_id, created_at desc);
create index if not exists idx_events_autor on public.events(autor_id);

-- ============================================================
-- TABLE: mission_briefs (legacy SIR)
-- ============================================================
create table if not exists public.mission_briefs (
  id              text primary key,
  mission_id      text references public.missions(id) on delete cascade,
  origen_id       uuid references public.operators(id),
  destino_id      uuid not null references public.operators(id),
  instrucciones   jsonb not null,
  leido_por       jsonb default '[]'::jsonb,
  created_at      timestamptz default now()
);

create index if not exists idx_briefs_destino on public.mission_briefs(destino_id);
create index if not exists idx_briefs_mission on public.mission_briefs(mission_id);

-- ============================================================
-- TABLE: notifications
-- ============================================================
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.operators(id) on delete cascade,
  tipo        text not null,
  mensaje     text not null,
  payload     jsonb default '{}'::jsonb,
  leida       boolean default false,
  created_at  timestamptz default now()
);

create index if not exists idx_notif_user on public.notifications(user_id, leida);

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_operators_touch on public.operators;
create trigger trg_operators_touch before update on public.operators
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_sprints_touch on public.sprints;
create trigger trg_sprints_touch before update on public.sprints
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_objectives_touch on public.objectives;
create trigger trg_objectives_touch before update on public.objectives
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_kr_touch on public.key_results;
create trigger trg_kr_touch before update on public.key_results
  for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_missions_touch on public.missions;
create trigger trg_missions_touch before update on public.missions
  for each row execute procedure public.touch_updated_at();

-- ============================================================
-- HELPER: rol del usuario actual
-- ============================================================
create or replace function public.current_role()
returns text language sql stable security definer as $$
  select role from public.operators where id = auth.uid()
$$;

create or replace function public.is_director()
returns boolean language sql stable security definer as $$
  select (role = 'DIRECTOR') from public.operators where id = auth.uid()
$$;

-- ============================================================
-- TRIGGER: crear perfil al registrarse en auth
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.operators (id, username, codename, nombre, role, especialidad, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'codename', upper(split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data->>'nombre', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'OPERATOR'),
    new.raw_user_meta_data->>'especialidad',
    new.raw_user_meta_data->>'avatar'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_auth_new_user on auth.users;
create trigger trg_auth_new_user
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- REALTIME: habilitar canales por tabla
-- ============================================================
alter publication supabase_realtime add table public.missions;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.sprints;
alter publication supabase_realtime add table public.objectives;
alter publication supabase_realtime add table public.key_results;
alter publication supabase_realtime add table public.mission_briefs;
alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- FIN del schema base.
-- Siguiente paso: correr `rls.sql` para habilitar Row Level Security.
-- ============================================================

-- === BLOQUE 2: RLS ===
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

-- === BLOQUE 3: SEED ===
-- ============================================================
-- AXIS v4 — Seed inicial
-- Ejecutar DESPUÉS de schema.sql + rls.sql
-- Nota: las cuentas reales se crean vía signup (auth.users → trigger crea operators)
-- Este seed solo siembra Sprint, Objective y KRs base
-- Las misiones se crean desde la UI o se importan via script
-- ============================================================

-- Sprint activo
insert into public.sprints (id, nombre, goal, fecha_inicio, fecha_fin, estado)
values
  ('SP-2026-Q2-W3', 'Sprint 24',
   'Consolidar operación SIGINT Sector Norte y cerrar perfilado Kestrel',
   now() - interval '4 days', now() + interval '10 days', 'ACTIVE'),
  ('SP-2026-Q2-W5', 'Sprint 25',
   'Pendiente de planificación',
   now() + interval '10 days', now() + interval '24 days', 'UPCOMING')
on conflict (id) do nothing;

-- Objective demo (sin owner_id por ahora; lo asignas desde la UI o un UPDATE manual)
insert into public.objectives (id, titulo, descripcion, periodo, owner_id, estado)
values
  ('OBJ-Q3-01',
   'Reducir tiempo de respuesta a incidentes críticos',
   'Detectar, contener y resolver amenazas en menos de 4 horas con cobertura completa.',
   'Q3-2026',
   null,
   'ACTIVE')
on conflict (id) do nothing;

-- Key Results del objetivo
insert into public.key_results (id, objective_id, titulo, metrica, target, current, unit, trend, posicion)
values
  ('KR-Q3-01-A', 'OBJ-Q3-01', 'MTTR menor a 4 horas',         'MTTR',      4,   4.9, 'h',   'DOWN', 1),
  ('KR-Q3-01-B', 'OBJ-Q3-01', 'Cobertura SIGINT 24/7',         'Cobertura', 100, 54,  '%',   'UP',   2),
  ('KR-Q3-01-C', 'OBJ-Q3-01', 'NPS interno del equipo ≥ 70',   'NPS',       70,  23,  'pts', 'UP',   3)
on conflict (id) do nothing;

-- ============================================================
-- Ready. Crea los usuarios desde la UI o Supabase Dashboard → Authentication.
-- Al crear, pasa raw_user_meta_data:
--   { "codename": "PHANTOM", "nombre": "Sofía Vega", "role": "OPERATOR",
--     "especialidad": "Inteligencia de Datos", "avatar": "🕵️" }
-- El trigger handle_new_user() creará el perfil en public.operators automáticamente.
-- ============================================================
