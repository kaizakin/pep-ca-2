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
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] font-mono text-[#151515]">
      <div className="border border-[#ece9e2] bg-white p-8 shadow-[0_18px_45px_rgba(20,20,20,0.04)]">
        <p className="text-sm font-black uppercase tracking-[-0.04em]">Completing GitHub sign-in…</p>
      </div>
    </main>
  );
}
