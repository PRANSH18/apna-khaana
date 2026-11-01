'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarClock, Lock, PackageCheck } from 'lucide-react';
import { Button } from '@/components/Button';
import { getPlan, getOrders, isDemo } from '@/lib/store';
import { currentWeekStart, formatWeekRange, sundayLockCountdown, timeOfDayGreeting } from '@/lib/week';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [mealCount, setMealCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const [hasOrderThisWeek, setHasOrderThisWeek] = useState(false);

  const weekStart = currentWeekStart();
  const countdown = sundayLockCountdown();

  useEffect(() => {
    (async () => {
      const [plan, orders] = await Promise.all([getPlan(), getOrders()]);
      if (plan) {
        setMealCount(plan.items.length);
        setLocked(plan.locked);
      }
      setHasOrderThisWeek(orders.some((o) => o.weekStart === weekStart));
      setLoading(false);
    })();
  }, [weekStart]);

  const hasPlan = mealCount > 0;
  const confirmed = locked || hasOrderThisWeek;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-leaf">Good {timeOfDayGreeting()}</p>
          <h1 className="mt-2 text-4xl sm:text-5xl">Your week, at a glance.</h1>
        </div>
        {isDemo && (
          <span className="rounded-full border border-butter bg-butter/10 px-3 py-2 text-sm font-semibold text-ink">
            Demo mode
          </span>
        )}
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-[1.3fr_.7fr]">
        <section className="rounded-3xl bg-ink p-7 text-paper shadow-soft sm:p-9">
          <div className="flex items-center justify-between">
            <span className="text-sm text-paper/60">Week of {formatWeekRange(weekStart)}</span>
            <CalendarClock size={20} className="text-butter" />
          </div>

          {loading ? (
            <div className="mt-14 h-24 animate-pulse rounded-xl bg-paper/10" />
          ) : confirmed ? (
            <>
              <h2 className="mt-14 text-3xl sm:text-4xl">Your week is confirmed.</h2>
              <p className="mt-3 max-w-md leading-7 text-paper/65">
                {mealCount} meals locked to the kitchen. It sources to this exact plan — next week starts fresh.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href="/app/orders">
                  <PackageCheck size={16} /> View my order
                </Button>
                <Button href="/app/plan" variant="outline">Plan next week</Button>
              </div>
            </>
          ) : hasPlan ? (
            <>
              <h2 className="mt-14 text-3xl sm:text-4xl">{mealCount} meals planned.</h2>
              <p className="mt-3 max-w-md leading-7 text-paper/65">
                Confirm before Sunday so the kitchen can source to it. {countdown.label}.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button href="/app/checkout">
                  Confirm &amp; checkout <ArrowUpRight size={16} />
                </Button>
                <Button href="/app/plan" variant="outline">Adjust plan</Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-14 text-3xl sm:text-4xl">Your plan is not set yet.</h2>
              <p className="mt-3 max-w-md leading-7 text-paper/65">
                Take two minutes to tell us what you need. We will build a week around it.
              </p>
              <div className="mt-7">
                <Button href="/app/plan">
                  Build my plan <ArrowUpRight size={16} />
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="rounded-3xl border border-ink/10 bg-white p-7 shadow-card sm:p-9">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-wash">
            <Lock className="text-leaf" size={20} />
          </div>
          <h2 className="mt-7 text-2xl sm:text-3xl">Sunday lock</h2>
          <p className="mt-3 leading-7 text-ink/60">
            Plans lock at 11:59pm every Sunday so our kitchen can source exactly what you chose.
          </p>
          <p className="mt-4 text-sm font-semibold text-leaf">{countdown.label}</p>
          <Link href="/how-it-works" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-leaf">
            How it works <ArrowUpRight size={14} />
          </Link>
        </section>
      </div>
    </>
  );
}
