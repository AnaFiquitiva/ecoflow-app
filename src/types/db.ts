/**
 * Alias de dominio derivados del contrato generado.
 *
 * `database.ts` NO se escribe a mano: lo produce `npm run types:db`
 * (o `types:db:local`) con `supabase gen types typescript` tras cada
 * migración. Aquí no se redefine ninguna columna; si el esquema cambia, la
 * compilación rompe en lugar de fallar en producción.
 */
import type { Database } from './database';

export type { Database, Json } from './database';

type Tablas = Database['public']['Tables'];

export type EstadoProyecto = Database['public']['Enums']['estado_proyecto'];

export type Proyecto = Tablas['proyectos']['Row'];
export type ProyectoInsert = Tablas['proyectos']['Insert'];

/**
 * El generador no ve los privilegios por columna (0004): para él todas las
 * columnas son actualizables. Se excluyen aquí las que el servidor rechaza,
 * para que el compilador lo sepa también.
 */
export type ProyectoUpdate = Omit<
  Tablas['proyectos']['Update'],
  'id' | 'codigo' | 'creado_por' | 'creado_en' | 'actualizado_en'
>;

export type Instalador = Tablas['instaladores']['Row'];
export type Material = Tablas['materiales']['Row'];
export type Disponibilidad = Database['public']['Views']['disponibilidad']['Row'];
