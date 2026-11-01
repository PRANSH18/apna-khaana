'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    setLoading(true);
    setError('');
    if (supabase) {
      const result = await supabase.auth.signUp({
        email: (form.elements.namedItem('email') as HTMLInputElement).value,
        password: (form.elements.namedItem('password') as HTMLInputElement).value,
        options: { data: { full_name: name } },
      });
      if (result.error) {
        setLoading(false);
        setError(result.error.message);
        return;
      }
      if (!result.data.session) {
        setLoading(false);
        setError('Check your email to confirm your account, then log in.');
        return;
      }
    } else {
      localStorage.setItem('apna_user', name || 'Friend');
    }
    location.href = '/app/plan';
  }

  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <p className="text-sm font-semibold text-leaf">Start with your goals</p>
      <h1 className="mt-4 text-4xl sm:text-5xl">Make this week yours.</h1>
      <form onSubmit={submit} className="mt-10 space-y-5">
        <label className="block text-sm font-semibold">
          Your name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 focus:border-leaf"
          />
        </label>
        <label className="block text-sm font-semibold">
          Email
          <input
            name="email"
            required
            type="email"
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 focus:border-leaf"
          />
        </label>
        <label className="block text-sm font-semibold">
          Password
          <input
            name="password"
            required
            minLength={6}
            type="password"
            className="mt-2 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 focus:border-leaf"
          />
        </label>
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <Button type="submit" disabled={loading} full>
          {loading ? 'Setting up…' : 'Set my preferences'}
        </Button>
      </form>
    </main>
  );
}
