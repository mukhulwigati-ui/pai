'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Eye, EyeOff, LockKeyhole, UserRound, GraduationCap, ArrowRight } from 'lucide-react';

// ============================================================================
// LOGIN PAGE
// ============================================================================

export default function LoginPage() {
  const router = useRouter();

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [identityNumber, setIdentityNumber] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ==========================================================================
  // LOGIN
  // ==========================================================================

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    const cleanIdentityNumber = identityNumber.trim();

    if (!cleanIdentityNumber) {
      setError('NIP / nomor identitas wajib diisi.');
      return;
    }

    if (!password) {
      setError('Password wajib diisi.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        credentials: 'include',

        cache: 'no-store',

        body: JSON.stringify({
          identity_number: cleanIdentityNumber,
          password,
        }),
      });

      let data: {
        success?: boolean;
        message?: string;
        error?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            'NIP / nomor identitas atau password tidak valid.'
        );
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat masuk ke sistem.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // FORM VALID
  // ==========================================================================

  const canSubmit =
    identityNumber.trim().length > 0 &&
    password.length > 0 &&
    !loading;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center bg-[#063d31] px-4 py-8 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-sdit.jpg')" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black/45" aria-hidden="true" />

      <section className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white bg-white shadow-[0_24px_70px_rgba(6,78,59,0.12)]">
        <header className="bg-[#063d31] px-6 py-8 text-center text-white sm:px-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <GraduationCap size={36} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">E-Rapor</h1>
          <p className="mt-2 text-lg font-medium text-emerald-100">SDIT Khoiro Ummah</p>
        </header>

        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="mb-7 text-2xl font-bold text-slate-900 sm:text-3xl">Masuk</h2>

          {error && (
            <div role="alert" id="login-error" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base leading-relaxed text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6" aria-busy={loading}>
            <div>
              <label htmlFor="identityNumber" className="mb-2 block text-base font-semibold text-slate-700">
                NIP / Nomor Identitas
              </label>
              <div className="relative">
                <UserRound size={22} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="identityNumber"
                  name="identityNumber"
                  type="text"
                  value={identityNumber}
                  onChange={(event) => {
                    setIdentityNumber(event.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={loading}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-describedby={error ? 'login-error' : undefined}
                  className="h-14 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-lg text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-base font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole size={22} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (error) setError('');
                  }}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  aria-describedby={error ? 'login-error' : undefined}
                  className="h-14 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-14 text-lg text-slate-900 outline-none transition focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={loading}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-xl text-slate-500 transition hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={22} aria-hidden="true" /> : <Eye size={22} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#07543f] text-lg font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#064735] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" aria-hidden="true" />
                  <span role="status">Memproses...</span>
                </>
              ) : (
                <>
                  <span>Masuk</span>
                  <ArrowRight size={22} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
