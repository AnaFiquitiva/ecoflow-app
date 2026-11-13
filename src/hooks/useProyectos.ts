import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { EstadoProyecto, Proyecto, ProyectoUpdate } from '@/types/db';
import type { NuevoProyecto } from '@/lib/schemas';

/** Columnas pedidas de forma explícita: select('*') rompe el contrato al migrar. */
const COLUMNAS =
  'id, codigo, cliente, direccion, estado, capacidad_kwp, fecha_inicio, fecha_fin, creado_por, creado_en, actualizado_en';

export interface UseProyectosResult {
  proyectos: Proyecto[];
  /** Agrupados por estado para las columnas del tablero. */
  porEstado: Record<EstadoProyecto, Proyecto[]>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  clearError: () => void;
  crear: (input: NuevoProyecto) => Promise<Proyecto | null>;
  cambiarEstado: (id: string, estado: EstadoProyecto) => Promise<boolean>;
  eliminar: (id: string) => Promise<boolean>;
}

const VACIO: Record<EstadoProyecto, Proyecto[]> = {
  pendiente: [],
  en_progreso: [],
  completado: [],
  cancelado: [],
};

/**
 * Única puerta de entrada a la tabla de proyectos. Ningún componente importa
 * supabase ni conoce nombres de tabla, de modo que la capa de datos se puede
 * probar sin montar la interfaz y la interfaz con un doble del hook.
 *
 * RLS hace el filtrado por asignación en el servidor: aquí no hay ni un
 * `.eq('instalador_id', ...)`. Si la política cambia, el hook no se toca.
 */
export function useProyectos(estado?: EstadoProyecto): UseProyectosResult {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const cargar = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      let q = supabase
        .from('proyectos')
        .select(COLUMNAS)
        .order('creado_en', { ascending: false });
      if (estado) q = q.eq('estado', estado);
      if (signal) q = q.abortSignal(signal);

      const { data, error: e } = await q;
      if (signal?.aborted) return;

      if (e) setError(new Error(e.message));
      else setProyectos(data as Proyecto[]);
      setLoading(false);
    },
    [estado]
  );

  // El AbortController evita que una petición del filtro anterior resuelva
  // más tarde y pise el estado actual.
  useEffect(() => {
    const ac = new AbortController();
    void cargar(ac.signal);
    return () => ac.abort();
  }, [cargar]);

  const crear = useCallback(async (input: NuevoProyecto) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError(new Error('Sesión no iniciada'));
      return null;
    }

    const { data, error: e } = await supabase
      .from('proyectos')
      .insert({
        codigo: input.codigo,
        cliente: input.cliente,
        direccion: input.direccion,
        capacidad_kwp: input.capacidad_kwp,
        fecha_inicio: input.fecha_inicio || null,
        fecha_fin: input.fecha_fin || null,
        creado_por: user.id,
      })
      .select(COLUMNAS)
      .single();

    if (e || !data) {
      setError(new Error(e?.message ?? 'No se pudo crear el proyecto'));
      return null;
    }
    const creado = data as Proyecto;
    setProyectos((prev) => [creado, ...prev]);
    return creado;
  }, []);

  const cambiarEstado = useCallback(
    async (id: string, estadoNuevo: EstadoProyecto) => {
      const previos = proyectos;
      // Actualización optimista: el tablero responde al instante.
      setProyectos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, estado: estadoNuevo } : p))
      );

      const patch: ProyectoUpdate = { estado: estadoNuevo };
      // completado exige fecha_fin (constraint completado_tiene_cierre).
      if (estadoNuevo === 'completado') {
        patch.fecha_fin = new Date().toISOString().slice(0, 10);
      }

      const { data, error: e } = await supabase
        .from('proyectos')
        .update(patch)
        .eq('id', id)
        .select(COLUMNAS)
        .single();

      if (e || !data) {
        setProyectos(previos); // rollback al estado exacto anterior
        setError(new Error(e?.message ?? 'No se pudo cambiar el estado'));
        return false;
      }
      const fresco = data as Proyecto;
      setProyectos((prev) => prev.map((p) => (p.id === id ? fresco : p)));
      return true;
    },
    [proyectos]
  );

  const eliminar = useCallback(
    async (id: string) => {
      const previos = proyectos;
      setProyectos((prev) => prev.filter((p) => p.id !== id));

      const { error: e } = await supabase.from('proyectos').delete().eq('id', id);
      if (e) {
        setProyectos(previos);
        setError(new Error(e.message));
        return false;
      }
      return true;
    },
    [proyectos]
  );

  const porEstado = useMemo(() => {
    const out: Record<EstadoProyecto, Proyecto[]> = {
      pendiente: [],
      en_progreso: [],
      completado: [],
      cancelado: [],
    };
    for (const p of proyectos) out[p.estado].push(p);
    return out;
  }, [proyectos]);

  return {
    proyectos,
    porEstado: proyectos.length === 0 && loading ? VACIO : porEstado,
    loading,
    error,
    refetch: () => cargar(),
    clearError: () => setError(null),
    crear,
    cambiarEstado,
    eliminar,
  };
}
