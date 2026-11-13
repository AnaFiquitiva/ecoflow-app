import { cn } from '@/lib/utils';
import type { EstadoProyecto } from '@/types/db';
import { ETIQUETA_ESTADO } from '@/lib/schemas';

const COLOR: Record<EstadoProyecto, string> = {
  pendiente: 'bg-neutral-100 text-neutral-700',
  en_progreso: 'bg-amber-100 text-amber-800',
  completado: 'bg-brand-100 text-brand-700',
  cancelado: 'bg-red-100 text-red-700',
};

export function EstadoBadge({ estado }: { estado: EstadoProyecto }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        COLOR[estado]
      )}
    >
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
