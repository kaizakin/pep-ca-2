import { useEffect } from 'react';
import { setToken } from '../lib/api';

type AuthCallbackProps = {
  onAuthenticated: () => void;
};

export function AuthCallback({ onAuthenticated }: AuthCallbackProps) {
  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');

    if (token) {
      setToken(token);
      onAuthenticated();
      window.location.replace('/dashboard');
    }
  }, [onAuthenticated]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <p className="text-lg font-semibold">Completing GitHub sign-in…</p>
      </div>
    </main>
  );
}
