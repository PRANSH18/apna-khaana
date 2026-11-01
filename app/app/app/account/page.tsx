'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { getProfile, saveProfile, signOut } from '@/lib/store';

export default function Account() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      setName(profile.name);
      setPhone(profile.phone);
      setAddress(profile.address);
      setLoading(false);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await saveProfile({ name, phone, address });
    setSaved(true);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    location.href = '/';
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-leaf">Your account</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">A few details about you.</h1>

      <form onSubmit={submit} className="mt-10 space-y-5 rounded-3xl border border-ink/10 bg-white p-7 shadow-card">
        <label className="block text-sm font-semibold">
          Full name
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-ink/20 px-3 py-3 focus:border-leaf disabled:opacity-50"
            placeholder="Your name"
          />
        </label>
        <label className="block text-sm font-semibold">
          Phone
          <input
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setSaved(false); }}
            disabled={loading}
            className="mt-2 w-full rounded-xl border border-ink/20 px-3 py-3 focus:border-leaf disabled:opacity-50"
            placeholder="+91"
          />
        </label>
        <label className="block text-sm font-semibold">
          Default delivery address
          <textarea
            value={address}
            onChange={(e) => { setAddress(e.target.value); setSaved(false); }}
            disabled={loading}
            className="mt-2 min-h-24 w-full rounded-xl border border-ink/20 px-3 py-3 focus:border-leaf disabled:opacity-50"
            placeholder="Flat, street, Bengaluru"
          />
        </label>
        <Button type="submit" disabled={loading}>{saved ? 'Saved' : 'Save details'}</Button>
      </form>

      <button onClick={handleSignOut} disabled={signingOut} className="mt-6 text-sm font-semibold text-danger disabled:opacity-50">
        {signingOut ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  );
}
