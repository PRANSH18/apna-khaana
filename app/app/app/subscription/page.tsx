'use client';

import { useEffect, useState } from 'react';
import { Repeat } from 'lucide-react';
import { Button } from '@/components/Button';
import { getSubscription, updateSubscriptionStatus, type SubscriptionRecord } from '@/lib/store';
import { formatWeekRange } from '@/lib/week';

const TIER_LABELS: Record<SubscriptionRecord['tier'], string> = { flex: 'Flex', weekly: 'Weekly', monthly: 'Monthly' };
const STATUS_STYLE: Record<SubscriptionRecord['status'], string> = {
  active: 'border-leaf text-leaf',
  paused: 'border-butter text-butter',
  cancelled: 'border-ink/15 text-ink/50',
};

export default function Subscription() {
  const [sub, setSub] = useState<SubscriptionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    (async () => {
      setSub(await getSubscription());
      setLoading(false);
    })();
  }, []);

  async function setStatus(status: SubscriptionRecord['status']) {
    setUpdating(true);
    const next = await updateSubscriptionStatus(status);
    if (next) setSub(next);
    setUpdating(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm font-semibold text-leaf">Your rhythm</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Subscription</h1>
        <div className="mt-10 h-40 animate-pulse rounded-3xl bg-wash" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-leaf">Your rhythm</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Subscription</h1>

      <section className="mt-10 rounded-3xl border border-ink/10 bg-white p-7 shadow-card sm:p-8">
        <div className="flex items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-wash">
              <Repeat className="text-leaf" size={20} />
            </div>
            <div>
              <p className="text-sm text-ink/50">Current plan</p>
              <h2 className="mt-1 text-2xl sm:text-3xl">
                {sub ? `${TIER_LABELS[sub.tier]} · ₹${Math.round(sub.price)}/meal` : 'No active plan'}
              </h2>
              {sub?.currentPeriodEnd && (
                <p className="mt-1 text-sm text-ink/50">This period runs to {formatWeekRange(sub.currentPeriodStart).split(' – ')[1] || sub.currentPeriodEnd}</p>
              )}
            </div>
          </div>
          <span className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold capitalize ${sub ? STATUS_STYLE[sub.status] : 'border-ink/15 text-ink/60'}`}>
            {sub ? sub.status : 'Not started'}
          </span>
        </div>

        {sub ? (
          <>
            <p className="mt-6 max-w-md leading-7 text-ink/60">
              Confirmed weeks stay scheduled even if you pause. Pausing only affects weeks you have not
              confirmed yet.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {sub.status !== 'active' && <Button onClick={() => setStatus('active')} disabled={updating}>Resume</Button>}
              {sub.status === 'active' && <Button variant="outline" onClick={() => setStatus('paused')} disabled={updating}>Pause</Button>}
              {sub.status !== 'cancelled' && (
                <button onClick={() => setStatus('cancelled')} disabled={updating} className="text-sm font-semibold text-danger disabled:opacity-50">
                  Cancel subscription
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="mt-6 max-w-md leading-7 text-ink/60">
              Choose your first week and we will keep your meals, deliveries and Sunday lock in one
              place.
            </p>
            <div className="mt-7">
              <Button href="/pricing">See plans</Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
