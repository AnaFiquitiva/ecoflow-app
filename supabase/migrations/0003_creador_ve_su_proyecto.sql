-- ============================================================================
-- EcoFlow — Quien crea un proyecto puede leerlo
--
-- Problema: el formulario hace INSERT ... RETURNING (supabase-js .select()).
-- PostgreSQL exige que la fila devuelta cumpla también la política de SELECT,
-- y quien acaba de crear el proyecto todavía no está en proyecto_instaladores.
-- Resultado: un instalador que no es coordinador recibía
--   "new row violates row-level security policy for table proyectos" (42501)
-- y no podía crear proyectos.
--
-- Solución: la lectura admite también creado_por = auth.uid(). I1 queda como
-- "un instalador solo lee los proyectos en los que está asignado o que él
-- mismo creó". La escritura NO se amplía: editar sigue exigiendo asignación.
-- creado_por no puede falsificarse: la política de INSERT exige
-- creado_por = auth.uid() y la columna tiene el UPDATE revocado.
-- ============================================================================

drop policy if exists "leo mis proyectos" on public.proyectos;

create policy "leo mis proyectos"
  on public.proyectos for select to authenticated
  using (
    public.esta_asignado(id)
    or creado_por = auth.uid()
    or public.es_coordinador()
  );                                                                     -- I1
