import { Dashboard } from '@/components/Dashboard';
import { ProyectoForm } from '@/components/ProyectoForm';
import { Button } from '@/components/ui/button';
import { useProyectos } from '@/hooks/useProyectos';
import { useAuth } from '@/hooks/useAuth';

/**
 * Compone: pide los datos al hook y los pasa a los componentes de
 * presentación. No hay lógica de Supabase en este archivo.
 */
export default function ProyectosPage() {
  const { esCoordinador } = useAuth();
  const {
    porEstado,
    loading,
    error,
    clearError,
    crear,
    cambiarEstado,
    eliminar,
  } = useProyectos();

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          <span>{error.message}</span>
          <Button tamano="sm" variante="fantasma" onClick={clearError}>
            Descartar
          </Button>
        </div>
      )}

      <ProyectoForm onSubmit={crear} />

      <Dashboard
        porEstado={porEstado}
        loading={loading}
        puedeEliminar={esCoordinador}
        onCambiarEstado={(id, estado) => void cambiarEstado(id, estado)}
        onEliminar={(id) => void eliminar(id)}
      />
    </div>
  );
}
