-- ============================================================================
-- Datos de demostración para la base LOCAL (supabase db reset los carga).
-- Contraseña de los tres usuarios: ecoflow123  — nunca usar en producción.
--
--   coord@ecoflow.test  coordinador (rol en app_metadata) — ve todo
--   ana@ecoflow.test    instaladora — asignada a EF-0001 y EF-0003
--   luis@ecoflow.test   instalador  — asignado a EF-0002 y EF-0004
-- ============================================================================

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id::uuid, 'authenticated', 'authenticated',
  u.email, extensions.crypt('ecoflow123', extensions.gen_salt('bf')), now(),
  u.app_meta::jsonb, jsonb_build_object('nombre', u.nombre), now(), now(),
  '', '', '', ''
from (values
  ('11111111-1111-1111-1111-111111111111', 'coord@ecoflow.test', 'Coordinación EcoFlow',
   '{"provider":"email","providers":["email"],"rol":"coordinador"}'),
  ('22222222-2222-2222-2222-222222222222', 'ana@ecoflow.test', 'Ana Instaladora',
   '{"provider":"email","providers":["email"]}'),
  ('33333333-3333-3333-3333-333333333333', 'luis@ecoflow.test', 'Luis Instalador',
   '{"provider":"email","providers":["email"]}')
) as u(id, email, nombre, app_meta);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users
where email like '%@ecoflow.test';

-- El trigger on_auth_user_created ya creó las filas de instaladores.

insert into public.materiales (id, sku, nombre, unidad, stock, costo_unitario) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'PAN-450', 'Panel monocristalino 450 W', 'ud', 100, 180.00),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'INV-5K',  'Inversor híbrido 5 kW',      'ud',  20, 950.00),
  ('aaaaaaaa-0000-0000-0000-000000000003', 'EST-AL',  'Estructura de aluminio',     'm',  300,  12.50),
  ('aaaaaaaa-0000-0000-0000-000000000004', 'CAB-6',   'Cable solar 6 mm²',          'm',  800,   1.80);

insert into public.proyectos
  (id, codigo, cliente, direccion, estado, capacidad_kwp, fecha_inicio, fecha_fin, creado_por)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'EF-0001', 'Panadería La Espiga',
   'Calle 45 #12-30', 'en_progreso', 9.00, current_date - 5, null,
   '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'EF-0002', 'Colegio San Martín',
   'Carrera 7 #80-10', 'pendiente', 25.50, current_date + 10, null,
   '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'EF-0003', 'Familia Rodríguez',
   'Transversal 3 #5-21', 'completado', 4.50, current_date - 30, current_date - 20,
   '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'EF-0004', 'Bodega Logística Norte',
   'Autopista Norte km 18', 'pendiente', 60.00, null, null,
   '11111111-1111-1111-1111-111111111111');

insert into public.proyecto_instaladores (proyecto_id, instalador_id, rol) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'lider'),
  ('bbbbbbbb-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'tecnico'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'lider'),
  ('bbbbbbbb-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'tecnico');

insert into public.proyecto_materiales (proyecto_id, material_id, cantidad) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 20),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 2),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 28),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000003', 120),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001', 10);
