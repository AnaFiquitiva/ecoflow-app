-- ============================================================================
-- EcoFlow — Row Level Security
-- Invariantes garantizados aquí:
--   I1  Un instalador solo lee los proyectos en los que está asignado.
--   I2  Solo el coordinador asigna instaladores a un proyecto.
--   I3  El stock de materiales no lo escribe ningún cliente.
--
-- Regla: RLS activada SIN políticas bloquea la tabla por completo. Cada tabla
-- de abajo tiene al menos una política de lectura a propósito.
-- ============================================================================

alter table public.instaladores          enable row level security;
alter table public.materiales            enable row level security;
alter table public.proyectos             enable row level security;
alter table public.proyecto_instaladores enable row level security;
alter table public.proyecto_materiales   enable row level security;

-- ----------------------------------------------------------------------------
-- Funciones auxiliares
--
-- La política de proyectos necesita consultar proyecto_instaladores, y la
-- política de proyecto_instaladores consultaría proyectos: eso es recursión
-- infinita (error 42P17). SECURITY DEFINER rompe el ciclo porque la función se
-- ejecuta con los privilegios de su dueño y no vuelve a evaluar RLS.
--   - set search_path = public  evita el secuestro de nombres de objeto.
--   - stable  permite al planificador reutilizar el resultado en la consulta.
-- ----------------------------------------------------------------------------
create or replace function public.esta_asignado(p_proyecto uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.proyecto_instaladores
    where proyecto_id = p_proyecto and instalador_id = auth.uid()
  );
$$;

-- El rol vive en app_metadata y NO en user_metadata: lo segundo lo escribe el
-- propio usuario con supabase.auth.updateUser(), lo que dejaría I2 en papel
-- mojado. app_metadata solo se escribe desde el servidor.
create or replace function public.es_coordinador()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'coordinador',
    false
  );
$$;

-- ----------------------------------------------------------------------------
-- proyectos
-- Toda política de UPDATE lleva USING y WITH CHECK: USING decide qué filas
-- puedes tocar, WITH CHECK valida la fila RESULTANTE. Sin WITH CHECK, un
-- instalador podría reasignarse un proyecto o cambiar quién lo creó.
-- ----------------------------------------------------------------------------
create policy "leo mis proyectos"
  on public.proyectos for select to authenticated
  using (public.esta_asignado(id) or public.es_coordinador());          -- I1

create policy "creo proyectos"
  on public.proyectos for insert to authenticated
  with check (creado_por = auth.uid());

create policy "edito mis proyectos"
  on public.proyectos for update to authenticated
  using (public.esta_asignado(id) or public.es_coordinador())
  with check (public.esta_asignado(id) or public.es_coordinador());

create policy "solo el coordinador borra proyectos"
  on public.proyectos for delete to authenticated
  using (public.es_coordinador());

-- ----------------------------------------------------------------------------
-- proyecto_instaladores
-- Las políticas PERMISSIVE se combinan con OR: la de lectura deja a cada
-- instalador ver sus asignaciones, y la del coordinador cubre la escritura.
-- ----------------------------------------------------------------------------
create policy "leo mis asignaciones"
  on public.proyecto_instaladores for select to authenticated
  using (instalador_id = auth.uid() or public.es_coordinador());

create policy "solo el coordinador asigna"
  on public.proyecto_instaladores for all to authenticated
  using (public.es_coordinador())
  with check (public.es_coordinador());                                 -- I2

-- ----------------------------------------------------------------------------
-- proyecto_materiales: el material de un proyecto lo gestiona quien lo ejecuta
-- ----------------------------------------------------------------------------
create policy "materiales de mis proyectos"
  on public.proyecto_materiales for all to authenticated
  using (public.esta_asignado(proyecto_id) or public.es_coordinador())
  with check (public.esta_asignado(proyecto_id) or public.es_coordinador());

-- ----------------------------------------------------------------------------
-- Catálogo e instaladores: lectura para todo el equipo
-- ----------------------------------------------------------------------------
create policy "catalogo legible"
  on public.materiales for select to authenticated using (true);

create policy "veo el equipo"
  on public.instaladores for select to authenticated using (true);

create policy "edito mi perfil"
  on public.instaladores for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- Privilegios de columna.
-- RLS filtra FILAS, no columnas: no puede expresar "esta columna es de solo
-- lectura". Eso se hace con REVOKE, y es lo que cumple I3.
-- ----------------------------------------------------------------------------
revoke update (stock, costo_unitario) on public.materiales
  from authenticated, anon;                                             -- I3
revoke update (codigo, creado_por, creado_en) on public.proyectos
  from authenticated;

-- ----------------------------------------------------------------------------
-- Vista de disponibilidad: deliberadamente SIN security_invoker.
--
-- Con security_invoker = true heredaría la RLS de proyecto_materiales, así que
-- cada instalador vería el stock reservado SOLO por los proyectos que puede
-- leer: el "disponible" saldría inflado y el dato no serviría para planificar.
-- Evaluada con su dueño, el número es global y correcto. El riesgo es acotado
-- porque la vista solo proyecta agregados por material: no revela ningún
-- proyecto, cliente ni asignación.
-- ----------------------------------------------------------------------------
grant select on public.disponibilidad to authenticated;
