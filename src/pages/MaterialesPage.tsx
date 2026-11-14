import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListaSkeleton } from '@/components/ui/skeleton';
import { useDisponibilidad } from '@/hooks/useDisponibilidad';

export default function MaterialesPage() {
  const { materiales, loading, error } = useDisponibilidad();

  if (loading) return <ListaSkeleton filas={4} />;
  if (error) return <p role="alert">{error.message}</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilidad de materiales</CardTitle>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 font-medium">Material</th>
              <th className="pb-2 text-right font-medium">Stock</th>
              <th className="pb-2 text-right font-medium">Reservado</th>
              <th className="pb-2 text-right font-medium">Disponible</th>
            </tr>
          </thead>
          <tbody>
            {materiales.map((m) => {
              // PostgreSQL no propaga NOT NULL a las columnas de una vista,
              // así que el tipo generado las declara anulables.
              const disponible = m.disponible ?? 0;
              return (
                <tr key={m.id} className="border-b border-neutral-100 last:border-0">
                  <td className="py-2 font-mono text-xs">{m.sku}</td>
                  <td className="py-2">{m.nombre}</td>
                  <td className="py-2 text-right">{m.stock ?? 0}</td>
                  <td className="py-2 text-right text-neutral-500">{m.reservado ?? 0}</td>
                  <td
                    className={
                      disponible <= 0
                        ? 'py-2 text-right font-semibold text-red-600'
                        : 'py-2 text-right font-semibold'
                    }
                  >
                    {disponible}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
