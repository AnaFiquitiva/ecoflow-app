-- ============================================================================
-- EcoFlow — Quien crea un proyecto también puede editarlo
--
-- Problema detectado al grabar la demo: tras 0003 el creador ya podía LEER su
-- proyecto, pero la política de UPDATE seguía exigiendo estar asignado. Al
-- pulsar "Pasar a en progreso", el UPDATE afectaba a 0 filas y supabase-js
-- devolvía PGRST116 ("Cannot coerce the result to a single JSON object").
--
-- Solución: la edición admite también creado_por = auth.uid(), igual que la
-- lectura. Lo que se puede editar sigue limitado por los privilegios de
-- columna de 0004 (codigo y creado_por son inmutables), así que el creador no
-- puede ceder ni falsificar la autoría.
-- ============================================================================

drop policy if exists "edito mis proyectos" on public.proyectos;

create policy "edito mis proyectos"
  on public.proyectos for update to authenticated
  using (
    public.esta_asignado(id)
    or creado_por = auth.uid()
    or public.es_coordinador()
  )
  with check (
    public.esta_asignado(id)
    or creado_por = auth.uid()
    or public.es_coordinador()
  );
