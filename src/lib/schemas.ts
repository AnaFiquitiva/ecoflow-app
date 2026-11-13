import { z } from 'zod';

/**
 * Validación del formulario.
 *
 * Cada regla de aquí tiene su CHECK equivalente en 0001_schema.sql. La
 * duplicación es deliberada y la dirección importa: zod valida en el cliente
 * para no gastar una ida y vuelta y dar mensajes útiles, pero la garantía real
 * es la del servidor. Si alguna vez discrepan, manda Postgres.
 *
 * El tipo del formulario sale de z.infer, así que no existe una segunda
 * definición que pueda desincronizarse.
 */
export const nuevoProyectoSchema = z.object({
  codigo: z
    .string()
    .regex(/^EF-\d{4}$/, 'Formato EF-0000, por ejemplo EF-0042'),
  cliente: z.string().trim().min(3, 'Mínimo 3 caracteres'),
  direccion: z.string().trim().min(5, 'Mínimo 5 caracteres'),
  capacidad_kwp: z.coerce
    .number({ invalid_type_error: 'Introduce un número' })
    .positive('Debe ser mayor que 0')
    .max(500, 'Máximo 500 kWp por instalación'),
  fecha_inicio: z.string().optional(),
  fecha_fin: z.string().optional(),
});

export type NuevoProyecto = z.infer<typeof nuevoProyectoSchema>;

/**
 * Refinamiento con la misma semántica que `constraint fechas_coherentes`.
 * Va aparte porque es una regla entre campos, no de un campo suelto.
 */
export const nuevoProyectoForm = nuevoProyectoSchema.refine(
  (v) => !v.fecha_inicio || !v.fecha_fin || v.fecha_fin >= v.fecha_inicio,
  { path: ['fecha_fin'], message: 'El cierre no puede preceder al inicio' }
);

export const ESTADOS = [
  'pendiente',
  'en_progreso',
  'completado',
  'cancelado',
] as const;

export const ETIQUETA_ESTADO: Record<(typeof ESTADOS)[number], string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completado: 'Completado',
  cancelado: 'Cancelado',
};
