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
