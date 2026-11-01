'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/Button';
import { getPlan, createOrder, getProfile, type Tier, type PlanItem } from '@/lib/store';

const TIER_RATES: Record<Tier, number> = { flex: 320, weekly: 300, monthly: 280 };
const TIER_LABELS: Record<Tier, string> = { flex: 'Flex', weekly: 'Weekly', monthly: 'Monthly' };

export default function Checkout() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [address, setAddress] = useState('');
  const [tier, setTier] = useState<Tier>('weekly');
  const [paid, setPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [plan, profile] = await Promise.all([getPlan(), getProfile()]);
      if (plan) setItems(plan.items);
      if (profile.address) setAddress(profile.address);
      setLoading(false);
    })();
  }, []);

  const rate = TIER_RATES[tier];
  const total = items.length * rate;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await createOrder({
      tier,
      total,
      address,
      items: items.map((it) => ({ day: it.day, slot: it.slot, mealName: it.name, kcal: it.kcal, protein: it.protein, price: rate })),
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || 'Could not record your order.');
      return;
    }
    setPaid(true);
  }

  if (paid) {
    return (
      <div className="max-w-2xl">
        <FlowSteps step={3} />
        <div className="mt-8 rounded-3xl border border-leaf bg-wash p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-leaf">
            <Check className="text-white" size={24} />
          </div>
          <p className="mt-5 text-sm font-semibold text-leaf">Payment recorded</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">Your week is confirmed.</h2>
          <p className="mt-4 leading-7 text-ink/65">
            This was a simulated payment — no money moved. Your {items.length}-meal week is locked to
            the kitchen and now shows on your dashboard and orders.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button href="/app">See my dashboard</Button>
            <Button href="/app/orders" variant="outline">View order</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="max-w-2xl">
        <FlowSteps step={2} />
        <div className="mt-8 rounded-3xl border border-ink/10 bg-white p-8 shadow-card">
          <h2 className="text-2xl">No plan to check out yet</h2>
          <p className="mt-3 leading-7 text-ink/60">
            Build a week first — checkout totals itself from the exact meals you picked, so there is
            nothing to confirm until a plan exists.
          </p>
          <div className="mt-7">
            <Button href="/app/plan">Build my plan</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <FlowSteps step={2} />

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-ink/10 bg-white p-7 shadow-card">
          <h2 className="text-2xl">Your week</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {(Object.keys(TIER_RATES) as Tier[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${tier === t ? 'border-leaf bg-leaf text-white' : 'border-ink/15 text-ink/60'}`}
              >
                {TIER_LABELS[t]} · ₹{TIER_RATES[t]}/meal
              </button>
            ))}
          </div>
          <div className="mt-6 space-y-3 text-sm">
            <p className="flex justify-between">
              <span className="text-ink/60">{loading ? 'Loading your plan…' : `${items.length} meals this week`}</span>
              <strong>{items.length} meals</strong>
            </p>
            <p className="flex justify-between">
              <span className="text-ink/60">{TIER_LABELS[tier]} rate</span>
              <strong>₹{rate} / meal</strong>
            </p>
            <p className="flex justify-between border-t border-ink/10 pt-3">
              <span className="text-ink/60">Total</span>
              <strong className="text-lg text-chili">₹{total.toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </section>

        <form onSubmit={submit} className="rounded-3xl border border-ink/10 bg-white p-7 shadow-card">
          <h2 className="text-2xl">Delivery details</h2>
          <label className="mt-7 block text-sm font-semibold">
            Address
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="Flat, street, Bengaluru"
              className="mt-2 w-full rounded-xl border border-ink/20 px-3 py-3 focus:border-leaf"
            />
          </label>
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-leaf bg-wash px-3 py-3 text-sm text-ink/70">
            <ShieldCheck size={16} className="shrink-0 text-leaf" /> Simulated payment · No money moves
          </div>
          {error && <p className="mt-4 text-sm font-medium text-danger">{error}</p>}
          <Button type="submit" disabled={submitting || loading || items.length === 0} full>
            {submitting ? 'Confirming…' : `Confirm and pay ₹${total.toLocaleString('en-IN')}`}
          </Button>
        </form>
      </div>
    </div>
  );
}

function FlowSteps({ step }: { step: 1 | 2 | 3 }) {
  const steps = ['Plan', 'Confirm', 'Track'];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < step;
        const active = n === step;
        return (
          <div key={label} className="flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${done ? 'bg-leaf text-white' : active ? 'bg-chili text-white' : 'bg-wash text-ink/40'}`}>
              {done ? <Check size={13} /> : n}
            </span>
            <span className={`text-sm font-semibold ${active || done ? 'text-ink' : 'text-ink/40'}`}>{label}</span>
            {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-ink/15" />}
          </div>
        );
      })}
    </div>
  );
}
