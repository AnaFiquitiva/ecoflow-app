import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Disponibilidad } from '@/types/db';

/**
 * Lee la vista `disponibilidad`, que calcula stock − reservado en el servidor.
 * El cálculo NO se hace aquí a propósito: agregarlo en el cliente obligaría a
 * traer todas las filas de proyecto_materiales y volvería a abrir la puerta al
 * doble conteo que documenta el README.
 */
export function useDisponibilidad() {
  const [materiales, setMateriales] = useState<Disponibilidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cargar = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    let q = supabase
      .from('disponibilidad')
      .select('id, sku, nombre, unidad, stock, reservado, disponible')
      .order('sku');
    if (signal) q = q.abortSignal(signal);

    const { data, error: e } = await q;
    if (signal?.aborted) return;

    if (e) setError(new Error(e.message));
    else setMateriales(data as Disponibilidad[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void cargar(ac.signal);
    return () => ac.abort();
  }, [cargar]);

  return { materiales, loading, error, refetch: () => cargar() };
}
