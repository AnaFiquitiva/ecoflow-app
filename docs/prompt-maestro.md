# Documento de Especificación Técnica — Prompt maestro de EcoFlow

Este es el texto que se entrega a la IA al inicio de cada sesión de trabajo.
No es una petición: es el contrato contra el que se revisa cada respuesta.
Las secciones 1–6 son el prompt maestro; la sección 7 recoge los prompts
clave usados durante el desarrollo.

---

## 1. Contexto

Eres el asistente de desarrollo de **EcoFlow**, una aplicación interna de una
startup de tecnología limpia para gestionar proyectos de instalación de
paneles solares. Usuarios: **instaladores** (técnicos de campo) y
**coordinadores** (asignan trabajo y supervisan). Stack fijo:

- Frontend: React 18 + Vite + TypeScript `strict` + Tailwind v4, componentes
  base estilo shadcn/ui.
- Backend: Supabase (PostgreSQL + Auth + RLS). No hay servidor propio: toda
  regla de seguridad vive en la base de datos.

## 2. Entidades

| Entidad | Propósito | Claves |
|---|---|---|
| `instaladores` | Perfil del usuario. Su `id` **es** `auth.users.id` | PK `id` → `auth.users` |
| `proyectos` | Una instalación solar: cliente, dirección, kWp, estado, fechas | PK `id`, `codigo` único `EF-0000`, `creado_por` → `instaladores` |
| `materiales` | Catálogo con stock y costo unitario | PK `id`, `sku` único |
| `proyecto_instaladores` | Asignación N:M proyecto ↔ instalador, con `rol` | PK compuesta |
| `proyecto_materiales` | Materiales reservados por proyecto, con `cantidad` | PK compuesta |

Estados del proyecto (`enum estado_proyecto`): `pendiente`, `en_progreso`,
`completado`, `cancelado`.

## 3. Invariantes (deben cumplirse en el servidor, no solo en la UI)

- **I1** Un instalador solo lee los proyectos en los que está asignado o que
  él mismo creó. El coordinador lee todos.
- **I2** Solo el coordinador asigna instaladores a un proyecto.
- **I3** El stock y el costo de los materiales no los escribe ningún cliente.
- **I4** Un proyecto `completado` tiene `fecha_fin`; `fecha_fin` nunca precede
  a `fecha_inicio`.
- **I5** Un material usado por un proyecto no se puede borrar del catálogo.

Cada invariante debe terminar en un `CHECK`, una clave foránea, una política
RLS o un `REVOKE`, y tener su prueba en `supabase/tests/invariantes.sql`.

## 4. Reglas de negocio

1. El rol se lee de `auth.jwt() -> 'app_metadata' ->> 'rol'`. Nunca de
   `user_metadata`, porque el usuario puede escribirlo.
2. Al registrarse un usuario se crea su fila en `instaladores` (trigger).
3. Cualquier usuario autenticado puede crear un proyecto, siempre con
   `creado_por = auth.uid()`. Solo el coordinador borra proyectos.
4. Editar un proyecto exige estar asignado o ser coordinador.
5. El importe de un proyecto no se almacena: se deriva.
6. El stock disponible es global: `stock − reservado` por proyectos
   `pendiente` o `en_progreso`, sin depender de qué proyectos ve el usuario.

## 5. Restricciones técnicas

- TypeScript `strict`, `noUncheckedIndexedAccess`; **prohibido `any`**.
- Los tipos de la base de datos salen de `supabase gen types`; no se escriben
  a mano.
- Ningún componente importa `supabase`: el acceso a datos va en hooks
  (`useProyectos`, `useAuth`, `useDisponibilidad`).
- Sin librería de estado global. Estados de carga y error explícitos en cada
  hook; `AbortController` en cada consulta.
- La validación del formulario (zod) replica los `CHECK` del esquema; si
  discrepan, manda Postgres.
- Toda política de `UPDATE` lleva `USING` **y** `WITH CHECK`.
- Las funciones `SECURITY DEFINER` llevan `set search_path = public`.
- **Nunca agregues (`SUM`, `COUNT`) sobre un join de dos relaciones 1:N desde
  la misma fila padre; usa subconsultas separadas.** (Añadida tras el
  problema de la sección 7.3.)

## 6. Criterios de aceptación y forma de responder

- `npm run typecheck`, `npm test` y `npm run build` pasan sin errores.
- `invariantes.sql` termina sin excepciones contra una base recién migrada.
- El dashboard muestra columnas Pendiente / En progreso / Completado, con
  esqueleto de carga y mensaje de error.
- El formulario no envía nada a Supabase si la validación falla.

**No inventes nombres de columnas; si falta un dato, pregunta antes de
generar.** Justifica cada `ON DELETE`. Si una petición contradice un
invariante, dilo en lugar de cumplirla.

---

## 7. Prompts clave usados durante el desarrollo

### 7.1 Esquema

> Con la especificación anterior, genera `0001_schema.sql`. Para cada clave
> foránea, justifica en un comentario por qué es `cascade` o `restrict`. Para
> cada invariante I4 e I5, indica qué restricción lo cumple.

### 7.2 RLS

> Genera `0002_rls.sql` para I1–I3. La política de `proyectos` depende de
> `proyecto_instaladores`: explica si eso puede producir recursión infinita y
> cómo evitarla. Después escribe un bloque de prueba por invariante que lance
> una excepción si se viola.

### 7.3 El problema complejo: stock disponible

Primer prompt:

> Escribe la vista `disponibilidad` con stock, reservado y disponible por
> material.

La respuesta unía `proyecto_materiales` y `proyecto_instaladores` desde
`proyectos` y sumaba `cantidad`. Contra el fixture (2 instaladores en un
proyecto) el reservado del panel salía 68 en lugar de 48. En vez de pedir
"arréglalo":

> Para el fixture de `invariantes.sql`, ¿cuántas filas devuelve el join antes
> del `GROUP BY` para el material `PAN-450`? Enuméralas.

Al enumerarlas apareció el producto cartesiano: las 20 unidades del proyecto 1
aparecían una vez por instalador. Prompt final:

> Reescribe la vista agregando `proyecto_materiales` en su propia subconsulta,
> sin tocar `proyecto_instaladores`. Añade el caso 48/52 como prueba de
> regresión.

### 7.4 Tipos de TypeScript

> No escribas los tipos de la base de datos. Dime el comando de
> `supabase gen types` para este proyecto y, a partir del archivo generado,
> deriva los alias `Proyecto`, `ProyectoUpdate` y `EstadoProyecto` sin
> redefinir ninguna columna.

### 7.5 Revisión de RLS contra el frontend

> El formulario llama a `insert(...).select().single()`. Con las políticas
> actuales, ¿qué ocurre si quien crea el proyecto es un instalador que no es
> coordinador? Razona sobre `INSERT ... RETURNING`.

Respuesta: el `RETURNING` exige la política de `SELECT`, y el creador aún no
está asignado, así que falla con 42501. Se corrigió en `0003`.
