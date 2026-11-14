import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface LoginFormProps {
  /** Devuelve el mensaje de error, o null si la sesión se abrió. */
  onEntrar: (email: string, password: string) => Promise<string | null>;
}

/** Presentación pura: la llamada a Supabase la hace useAuth. */
export function LoginForm({ onEntrar }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(await onEntrar(email, password));
    setEnviando(false);
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3" onSubmit={(e) => void enviar(e)}>
          <label>
            <span className="mb-1 block text-xs font-medium text-neutral-700">Email</span>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-neutral-700">
              Contraseña
            </span>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <span role="alert" className="text-xs text-red-600">
              {error}
            </span>
          )}
          <Button type="submit" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
