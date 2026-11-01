'use client';

import { useEffect, useState } from 'react';
import { PackageCheck, ChevronDown } from 'lucide-react';
import { Button } from '@/components/Button';
import { getOrders, type OrderRecord } from '@/lib/store';
import { formatWeekRange } from '@/lib/week';

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'border-leaf text-leaf',
  preparing: 'border-butter text-butter',
  out_for_delivery: 'border-chili text-chili',
  delivered: 'border-ink/15 text-ink/50',
};

export default function Orders() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setOrders(await getOrders());
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div>
        <p className="text-sm font-semibold text-leaf">Your kitchen trail</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Orders</h1>
        <div className="mt-10 h-40 animate-pulse rounded-3xl bg-wash" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-leaf">Your kitchen trail</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Orders</h1>
        <section className="mt-10 rounded-3xl border border-ink/10 bg-white p-8 shadow-card">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-wash">
            <PackageCheck className="text-leaf" size={20} />
          </div>
          <h2 className="mt-7 text-2xl sm:text-3xl">No orders yet</h2>
          <p className="mt-3 max-w-md leading-7 text-ink/60">
            Your first confirmed week will appear here with its meals, delivery status and payment
            record.
          </p>
          <div className="mt-7">
            <Button href="/app/plan">Build a plan</Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-leaf">Your kitchen trail</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Orders</h1>

      <div className="mt-10 grid gap-4">
        {orders.map((order) => (
          <section key={order.id} className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-7">
            <button onClick={() => setOpen(open === order.id ? null : order.id)} className="flex w-full items-center justify-between gap-4 text-left">
              <div>
                <p className="text-sm text-ink/50">Week of {formatWeekRange(order.weekStart)}</p>
                <h2 className="mt-1 text-xl sm:text-2xl">₹{order.total.toLocaleString('en-IN')} · {order.items.length} meals</h2>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[order.status] || 'border-ink/15 text-ink/60'}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <ChevronDown size={18} className={`text-ink/40 transition ${open === order.id ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {open === order.id && (
              <div className="mt-5 space-y-2 border-t border-ink/10 pt-5">
                {order.items.map((it, i) => (
                  <p key={i} className="flex justify-between text-sm">
                    <span className="text-ink/60 capitalize">{it.slot} · {it.mealName}</span>
                    <span className="text-ink/45">{it.kcal} kcal · ₹{it.price}</span>
                  </p>
                ))}
                <p className="pt-2 text-xs text-ink/40">Payment: {order.paymentStatus.replace(/_/g, ' ')}</p>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
