-- ============================================================================
-- Pruebas de los invariantes. Se ejecutan contra una base local:
--   supabase db reset && psql "$DATABASE_URL" -f supabase/tests/invariantes.sql
--
-- Cada bloque falla con una excepción si el invariante no se cumple, así que
-- el script entero sirve como test de regresión en CI.
-- ============================================================================

begin;

-- Parte de una base vacía aunque se haya cargado seed.sql. El rollback del
-- final deshace también este borrado, así que los datos de demo sobreviven.
delete from public.proyectos;
delete from public.materiales;
delete from auth.users where email like '%@ecoflow.test';

-- Datos de prueba: un coordinador, dos instaladores, dos proyectos.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'coord@ecoflow.test'),
  ('22222222-2222-2222-2222-222222222222', 'ana@ecoflow.test'),
  ('33333333-3333-3333-3333-333333333333', 'luis@ecoflow.test');

insert into public.materiales (id, sku, nombre, stock, costo_unitario) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'PAN-450', 'Panel 450W', 100, 180.00),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'INV-5K', 'Inversor 5kW', 20, 950.00);

insert into public.proyectos (id, codigo, cliente, direccion, capacidad_kwp, creado_por)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'EF-0001', 'Cliente A',
   'Calle 1 #23-45', 9.00, '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'EF-0002', 'Cliente B',
   'Carrera 7 #80-10', 12.50, '11111111-1111-1111-1111-111111111111');

-- Ana al proyecto 1, Luis al proyecto 2.
insert into public.proyecto_instaladores (proyecto_id, instalador_id) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333');

-- Dos instaladores en el proyecto 1 para provocar el fan-out si alguien
-- vuelve a agregar sobre un join de dos relaciones 1:N.
insert into public.proyecto_instaladores (proyecto_id, instalador_id) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111');

insert into public.proyecto_materiales (proyecto_id, material_id, cantidad) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 20),
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000002', 2),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 28);

-- ---------------------------------------------------------------------------
-- I1: un instalador solo lee los proyectos en los que está asignado.
-- ---------------------------------------------------------------------------
do $$
declare n integer;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.proyectos;
  if n <> 1 then
    raise exception 'I1 falla: Ana ve % proyectos, esperaba 1', n;
  end if;
  reset role;
end $$;

-- ---------------------------------------------------------------------------
-- I1b (0003): un instalador crea un proyecto y puede leerlo de vuelta
-- (INSERT ... RETURNING, lo mismo que hace el formulario), pero Luis no lo ve.
-- ---------------------------------------------------------------------------
do $$
declare v_codigo text; n integer;
begin
  perform set_config('request.jwt.claims',
    '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
  set local role authenticated;
  insert into public.proyectos (codigo, cliente, direccion, capacidad_kwp, creado_por)
  values ('EF-0100', 'Cliente Ana', 'Calle 9 #10-11', 5.00,
          '22222222-2222-2222-2222-222222222222')
  returning codigo into v_codigo;
  if v_codigo is distinct from 'EF-0100' then
    raise exception 'I1b falla: el creador no puede leer su proyecto';
  end if;
  reset role;

  perform set_config('request.jwt.claims',
    '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.proyectos where codigo = 'EF-0100';
  if n <> 0 then
    raise exception 'I1b falla: Luis ve un proyecto ajeno';
  end if;
  reset role;
end $$;

-- ---------------------------------------------------------------------------
-- I2: un instalador no puede asignarse a otro proyecto.
-- ---------------------------------------------------------------------------
do $$
begin
  perform set_config('request.jwt.claims',
    '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
  set local role authenticated;
  begin
    insert into public.proyecto_instaladores (proyecto_id, instalador_id)
    values ('bbbbbbbb-0000-0000-0000-000000000002',
            '22222222-2222-2222-2222-222222222222');
    reset role;
    raise exception 'I2 falla: un instalador logró asignarse solo';
  exception when insufficient_privilege then
    reset role;  -- RLS lo rechazó: correcto
  end;
end $$;

-- ---------------------------------------------------------------------------
-- I3: el stock no lo escribe el cliente (privilegio de columna revocado).
-- ---------------------------------------------------------------------------
do $$
begin
  perform set_config('request.jwt.claims',
    '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
  set local role authenticated;
  begin
    update public.materiales set stock = 9999
    where id = 'aaaaaaaa-0000-0000-0000-000000000001';
    reset role;
    raise exception 'I3 falla: se pudo escribir el stock';
  exception when insufficient_privilege then
    reset role;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- I3b (0004): un instalador asignado no puede cambiar quién creó el proyecto.
-- ---------------------------------------------------------------------------
do $$
begin
  perform set_config('request.jwt.claims',
    '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
  set local role authenticated;
  begin
    update public.proyectos
    set creado_por = '22222222-2222-2222-2222-222222222222'
    where id = 'bbbbbbbb-0000-0000-0000-000000000001';
    reset role;
    raise exception 'I3b falla: se pudo cambiar creado_por';
  exception when insufficient_privilege then
    reset role;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- I4: un proyecto completado exige fecha_fin.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    update public.proyectos set estado = 'completado'
    where id = 'bbbbbbbb-0000-0000-0000-000000000001';
    raise exception 'I4 falla: se completó un proyecto sin fecha_fin';
  exception when check_violation then
    null;  -- correcto
  end;
end $$;

-- ---------------------------------------------------------------------------
-- I5: un material usado no se puede borrar del catálogo.
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    delete from public.materiales
    where id = 'aaaaaaaa-0000-0000-0000-000000000001';
    raise exception 'I5 falla: se borró un material en uso';
  exception when foreign_key_violation then
    null;  -- correcto
  end;
end $$;

-- ---------------------------------------------------------------------------
-- Regresión del fan-out: el panel tiene 48 reservados (20 + 28), no 68.
-- Con el join directo sobre las dos relaciones 1:N saldría 68, porque las 20
-- unidades del proyecto 1 se contarían dos veces (tiene dos instaladores).
-- ---------------------------------------------------------------------------
do $$
declare r integer;
begin
  select reservado into r from public.disponibilidad where sku = 'PAN-450';
  if r <> 48 then
    raise exception 'Fan-out: reservado = %, esperaba 48', r;
  end if;
  select disponible into r from public.disponibilidad where sku = 'PAN-450';
  if r <> 52 then
    raise exception 'Disponible = %, esperaba 52', r;
  end if;
end $$;

rollback;
