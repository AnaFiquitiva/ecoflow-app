import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface UseAuthResult {
  session: Session | null;
  /** Viene de app_metadata del JWT, que solo se escribe en el servidor. */
  esCoordinador: boolean;
  loading: boolean;
  /** Devuelve el mensaje de error, o null si la sesión se abrió. */
  entrar: (email: string, password: string) => Promise<string | null>;
  salir: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let vivo = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      if (vivo) setSession(s);
    });

    // Limpieza del efecto: sin unsubscribe, cada montaje añade un listener.
    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const rol = session?.user.app_metadata['rol'];

  return {
    session,
    esCoordinador: rol === 'coordinador',
    loading,
    entrar: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    },
    salir: async () => {
      await supabase.auth.signOut();
    },
  };
}
