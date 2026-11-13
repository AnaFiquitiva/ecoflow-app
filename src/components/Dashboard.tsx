import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EstadoBadge } from '@/components/ui/badge';
import { ListaSkeleton } from '@/components/ui/skeleton';
import { ETIQUETA_ESTADO } from '@/lib/schemas';
import { formatFecha, formatKwp } from '@/lib/utils';
import type { EstadoProyecto, Proyecto } from '@/types/db';

/** Columnas del tablero. 'cancelado' se consulta aparte, no ocupa carril. */
const CARRILES: readonly EstadoProyecto[] = [
  'pendiente',
  'en_progreso',
  'completado',
];

const SIGUIENTE: Partial<Record<EstadoProyecto, EstadoProyecto>> = {
  pendiente: 'en_progreso',
  en_progreso: 'completado',
};

export interface DashboardProps {
  porEstado: Record<EstadoProyecto, Proyecto[]>;
  loading: boolean;
  puedeEliminar: boolean;
  onCambiarEstado: (id: string, estado: EstadoProyecto) => void;
  onEliminar: (id: string) => void;
}

/**
 * Presentación pura: recibe los proyectos ya agrupados y no conoce Supabase,
 * nombres de tabla ni políticas. Se puede renderizar en una prueba pasándole
 * datos a mano, sin red.
 */
export function Dashboard({
  porEstado,
  loading,
  puedeEliminar,
  onCambiarEstado,
  onEliminar,
}: DashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {CARRILES.map((estado) => (
        <section key={estado} aria-labelledby={`carril-${estado}`}>
          <div className="mb-2 flex items-center justify-between">
            <h2
              id={`carril-${estado}`}
              className="text-sm font-semibold text-neutral-700"
            >
              {ETIQUETA_ESTADO[estado]}
            </h2>
            <span className="text-xs text-neutral-500">
              {porEstado[estado].length}
            </span>
          </div>

          {loading ? (
            <ListaSkeleton filas={2} />
          ) : porEstado[estado].length === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-300 px-3 py-6 text-center text-xs text-neutral-500">
              Sin proyectos
            </p>
          ) : (
            <ul className="space-y-2">
              {porEstado[estado].map((p) => (
                <li key={p.id}>
                  <ProyectoCard
                    proyecto={p}
                    puedeEliminar={puedeEliminar}
                    onCambiarEstado={onCambiarEstado}
                    onEliminar={onEliminar}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function ProyectoCard({
  proyecto: p,
  puedeEliminar,
  onCambiarEstado,
  onEliminar,
}: {
  proyecto: Proyecto;
  puedeEliminar: boolean;
  onCambiarEstado: (id: string, estado: EstadoProyecto) => void;
  onEliminar: (id: string) => void;
}) {
  const siguiente = SIGUIENTE[p.estado];

  return (
    <Card>
      <CardHeader className="flex items-start justify-between gap-2">
        <div>
          <CardTitle>{p.cliente}</CardTitle>
          <p className="mt-0.5 font-mono text-xs text-neutral-500">{p.codigo}</p>
        </div>
        <EstadoBadge estado={p.estado} />
      </CardHeader>
      <CardContent className="space-y-2">
        <dl className="space-y-0.5 text-xs text-neutral-600">
          <div className="flex justify-between">
            <dt>Capacidad</dt>
            <dd className="font-medium text-neutral-900">
              {formatKwp(p.capacidad_kwp)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Inicio</dt>
            <dd>{formatFecha(p.fecha_inicio)}</dd>
          </div>
          {p.fecha_fin && (
            <div className="flex justify-between">
              <dt>Cierre</dt>
              <dd>{formatFecha(p.fecha_fin)}</dd>
            </div>
          )}
        </dl>
        <p className="truncate text-xs text-neutral-500" title={p.direccion}>
          {p.direccion}
        </p>

        <div className="flex gap-1 pt-1">
          {siguiente && (
            <Button
              tamano="sm"
              variante="secundario"
              onClick={() => onCambiarEstado(p.id, siguiente)}
            >
              Pasar a {ETIQUETA_ESTADO[siguiente].toLowerCase()}
            </Button>
          )}
          {puedeEliminar && (
            <Button
              tamano="sm"
              variante="peligro"
              onClick={() => onEliminar(p.id)}
              aria-label={`Eliminar ${p.codigo}`}
            >
              Eliminar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
