-- ============================================================================
-- EcoFlow — Esquema
-- Invariantes que este archivo garantiza (ver README):
--   I4  Un proyecto completado tiene fecha_fin; fecha_fin nunca precede a inicio.
--   I5  Un material usado por un proyecto no puede borrarse del catálogo.
-- ============================================================================

create type estado_proyecto as enum
  ('pendiente', 'en_progreso', 'completado', 'cancelado');

-- El perfil EXTIENDE a auth.users en lugar de competir con él: la identidad
-- tiene una sola fuente y no hay dos tablas que sincronizar.
create table public.instaladores (
  id            uuid primary key references auth.users (id) on delete cascade,
  nombre        text not null check (length(trim(nombre)) >= 3),
  certificacion text,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

create table public.materiales (
  id             uuid primary key default gen_random_uuid(),
  sku            text not null unique,
  nombre         text not null,
  unidad         text not null default 'ud',
  stock          integer not null default 0 check (stock >= 0),
  costo_unitario numeric(10, 2) not null check (costo_unitario >= 0)
);

create table public.proyectos (
  id             uuid primary key default gen_random_uuid(),
  codigo         text not null unique check (codigo ~ '^EF-[0-9]{4}$'),
  cliente        text not null check (length(trim(cliente)) >= 3),
  direccion      text not null check (length(trim(direccion)) >= 5),
  estado         estado_proyecto not null default 'pendiente',
  capacidad_kwp  numeric(8, 2) not null check (capacidad_kwp > 0),
  fecha_inicio   date,
  fecha_fin      date,
  -- restrict: borrar un instalador no debe borrar la historia del proyecto
  creado_por     uuid not null references public.instaladores (id) on delete restrict,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint fechas_coherentes
    check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio),
  constraint completado_tiene_cierre
    check (estado <> 'completado' or fecha_fin is not null)
);

-- N:M en los dos sentidos. Clave primaria compuesta: impide asignar dos veces
-- al mismo instalador sin un índice único extra, y da gratis el índice del
-- primer componente. cascade porque la relación no existe sin sus extremos.
create table public.proyecto_instaladores (
  proyecto_id   uuid not null references public.proyectos (id) on delete cascade,
  instalador_id uuid not null references public.instaladores (id) on delete cascade,
  rol           text not null default 'tecnico',
  asignado_en   timestamptz not null default now(),
  primary key (proyecto_id, instalador_id)
);

-- restrict en material_id: cumple I5
create table public.proyecto_materiales (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  material_id uuid not null references public.materiales (id) on delete restrict,
  cantidad    integer not null check (cantidad > 0),
  primary key (proyecto_id, material_id)
);

-- Los predicados de RLS se evalúan fila a fila: sin estos índices, cada
-- consulta del dashboard degenera en un seq scan.
create index proyectos_estado_creado_idx
  on public.proyectos (estado, creado_en desc);
create index proyecto_instaladores_instalador_idx
  on public.proyecto_instaladores (instalador_id);
create index proyecto_materiales_material_idx
  on public.proyecto_materiales (material_id);

-- actualizado_en lo fija el servidor, no el cliente
create or replace function public.touch_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger proyectos_touch
  before update on public.proyectos
  for each row execute function public.touch_actualizado_en();

-- Al registrarse un usuario, se crea su perfil de instalador.
create or replace function public.crear_instalador()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.instaladores (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', 'Sin nombre'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_instalador();

-- ----------------------------------------------------------------------------
-- Vista de disponibilidad.
-- El reservado se agrega en su PROPIA subconsulta. Agregar sobre un join de
-- dos relaciones 1:N (materiales y instaladores desde proyectos) multiplica
-- las filas por el producto cartesiano y SUM cuenta de más.
-- ----------------------------------------------------------------------------
create view public.disponibilidad as
select
  m.id,
  m.sku,
  m.nombre,
  m.unidad,
  m.stock,
  coalesce(r.reservado, 0) as reservado,
  m.stock - coalesce(r.reservado, 0) as disponible
from public.materiales m
left join (
  select pm.material_id, sum(pm.cantidad) as reservado
  from public.proyecto_materiales pm
  join public.proyectos p on p.id = pm.proyecto_id
  where p.estado in ('pendiente', 'en_progreso')
  group by pm.material_id
) r on r.material_id = m.id;
