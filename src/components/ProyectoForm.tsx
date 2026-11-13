import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { nuevoProyectoForm, type NuevoProyecto } from '@/lib/schemas';

export interface ProyectoFormProps {
  onSubmit: (valores: NuevoProyecto) => Promise<unknown>;
}

/**
 * Valida ANTES de llamar a Supabase. El esquema zod replica los CHECK de la
 * base de datos, así que un error de formato no gasta una ida y vuelta; la
 * garantía real sigue siendo la del servidor.
 */
export function ProyectoForm({ onSubmit }: ProyectoFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NuevoProyecto>({
    resolver: zodResolver(nuevoProyectoForm),
    defaultValues: { codigo: '', cliente: '', direccion: '' },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          noValidate
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={handleSubmit(async (valores) => {
            const creado = await onSubmit(valores);
            if (creado) reset();
          })}
        >
          <Campo etiqueta="Código" error={errors.codigo?.message}>
            <Input
              placeholder="EF-0042"
              aria-invalid={Boolean(errors.codigo)}
              {...register('codigo')}
            />
          </Campo>

          <Campo etiqueta="Cliente" error={errors.cliente?.message}>
            <Input
              placeholder="Nombre del cliente"
              aria-invalid={Boolean(errors.cliente)}
              {...register('cliente')}
            />
          </Campo>

          <Campo
            etiqueta="Dirección"
            error={errors.direccion?.message}
            className="sm:col-span-2"
          >
            <Input
              placeholder="Calle 1 #23-45"
              aria-invalid={Boolean(errors.direccion)}
              {...register('direccion')}
            />
          </Campo>

          <Campo etiqueta="Capacidad (kWp)" error={errors.capacidad_kwp?.message}>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="9.00"
              aria-invalid={Boolean(errors.capacidad_kwp)}
              {...register('capacidad_kwp')}
            />
          </Campo>

          <Campo etiqueta="Inicio previsto" error={errors.fecha_inicio?.message}>
            <Input type="date" {...register('fecha_inicio')} />
          </Campo>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando…' : 'Crear proyecto'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Campo({
  etiqueta,
  error,
  className,
  children,
}: {
  etiqueta: string;
  error?: string | undefined;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-neutral-700">
        {etiqueta}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
