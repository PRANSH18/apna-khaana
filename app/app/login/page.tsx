'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    setLoading(true);
    setError('');
    if (supabase) {
      const result = await supabase.auth.signInWithPassword({
        email,
        password: (form.elements.namedItem('password') as HTMLInputElement).value,
      });
      if (result.error) {
        setLoading(false);
        setError(result.error.message);
        return;
      }
    }
    location.href = '/app';
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <p className="text-sm font-semibold text-leaf">Welcome back</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Your week is waiting.</h1>
      <form onSubmit={submit} className="mt-10 space-y-5">
        <label className="block text-sm font-semibold">
          Email
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 focus:border-leaf"
          />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            name="password"
            required
            type="password"
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 focus:border-leaf"
          />
        </label>
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" disabled={loading} full>
          {loading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
      <p className="mt-8 text-sm text-ink/60">
        New here?{' '}
        <Link href="/signup" className="font-semibold text-leaf">
          Create your account
        </Link>
      </p>
    </main>
  );
}
