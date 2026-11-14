-- ============================================================================
-- EcoFlow — Privilegios de columna que sí funcionan
--
-- Problema detectado por invariantes.sql (I3): 0002 hacía
--   revoke update (stock, costo_unitario) on materiales ...
--   revoke update (codigo, creado_por, creado_en) on proyectos ...
-- pero Supabase concede por defecto UPDATE sobre la TABLA COMPLETA a
-- authenticated y anon. En PostgreSQL, revocar el privilegio de una columna
-- no anula el privilegio de tabla, así que esos REVOKE no tenían efecto: un
-- instalador asignado podía cambiar creado_por o codigo.
--
-- Solución: quitar el UPDATE de tabla y conceder UPDATE solo en las columnas
-- que el cliente puede escribir (lista blanca en vez de lista negra).
-- actualizado_en no se concede: lo fija el trigger, que no necesita permisos.
-- ============================================================================

-- I3: ningún cliente actualiza materiales (stock y costo los gestiona el servidor).
revoke update on public.materiales from authenticated, anon;

-- proyectos: codigo, creado_por y creado_en quedan inmutables para el cliente.
revoke update on public.proyectos from authenticated, anon;
grant update (cliente, direccion, estado, capacidad_kwp, fecha_inicio, fecha_fin)
  on public.proyectos to authenticated;
