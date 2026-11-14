import { lazy, Suspense } from 'react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoginForm } from '@/components/LoginForm';
import { ListaSkeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// La página de proyectos es la de entrada y no se diferiere: es la que marca
// el LCP. Las demás salen del chunk inicial.
import ProyectosPage from '@/pages/ProyectosPage';
const MaterialesPage = lazy(() => import('@/pages/MaterialesPage'));

export default function App() {
  const { session, esCoordinador, loading, entrar, salir } = useAuth();

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">EcoFlow</h1>
          <p className="text-xs text-neutral-500">
            Gestión de instalaciones solares
          </p>
        </div>

        <nav className="flex items-center gap-1">
          <Enlace to="/">Proyectos</Enlace>
          <Enlace to="/materiales">Materiales</Enlace>
        </nav>

        {!loading && session && (
          <div className="flex items-center gap-2 text-xs text-neutral-600">
            <span>
              {session.user.email}
              {esCoordinador && ' · coordinador'}
            </span>
            <Button tamano="sm" variante="secundario" onClick={() => void salir()}>
              Salir
            </Button>
          </div>
        )}
      </header>

      <main>
        {loading ? (
          <ListaSkeleton filas={4} />
        ) : !session ? (
          // Sin sesión RLS no devuelve filas: se pide login en lugar de
          // mostrar un tablero vacío que parezca un error.
          <LoginForm onEntrar={entrar} />
        ) : (
          // key: al cambiar de usuario se remonta todo y no quedan datos
          // del anterior en memoria.
          <Suspense key={session.user.id} fallback={<ListaSkeleton filas={4} />}>
            <Routes>
              <Route path="/" element={<ProyectosPage />} />
              <Route path="/materiales" element={<MaterialesPage />} />
            </Routes>
          </Suspense>
        )}
      </main>
    </div>
  );
}

function Enlace({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
          isActive
            ? 'bg-brand-100 text-brand-700'
            : 'text-neutral-600 hover:bg-neutral-100'
        )
      }
    >
      {children}
    </NavLink>
  );
}
