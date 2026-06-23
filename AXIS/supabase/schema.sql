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
