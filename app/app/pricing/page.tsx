'use client';

import { useState } from 'react';
import { Button } from '@/components/Button';

const TIERS = [
  { name: 'Flex', rate: 320, desc: 'Try a week, no commitment.', label: 'Pay per week' },
  { name: 'Weekly', rate: 300, desc: 'Your everyday plan with a little more value.', label: 'Most chosen' },
  { name: 'Monthly', rate: 280, desc: 'Four weeks of good habits, at the best rate.', label: 'Best value' },
];

export default function Pricing() {
  const [mealsPerDay, setMealsPerDay] = useState<2 | 3>(3);
  const mealsPerWeek = mealsPerDay * 7;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm font-semibold text-leaf">Simple, honest pricing</p>
        <h1 className="text-5xl sm:text-6xl">Your meals, your rhythm.</h1>
        <p className="mt-6 text-lg leading-8 text-ink/60">
          Choose two or three meals a day. Every number below is calculated live from your choice, so
          there are no surprises at checkout.
        </p>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <span className="text-sm font-semibold text-ink/60">Meals per day</span>
        {[2, 3].map((n) => (
          <button
            key={n}
            onClick={() => setMealsPerDay(n as 2 | 3)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${mealsPerDay === n ? 'border-leaf bg-leaf text-white' : 'border-ink/15 text-ink/70'}`}
          >
            {n} / day
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {TIERS.map((tier, i) => {
          const weekly = tier.rate * mealsPerWeek;
          return (
            <div
              key={tier.name}
              className={`flex flex-col rounded-3xl border p-7 ${
                i === 1 ? 'border-chili bg-white shadow-pop' : 'border-ink/15 bg-white shadow-card'
              }`}
            >
              <span className={`text-sm font-semibold ${i === 1 ? 'text-chili' : 'text-leaf'}`}>{tier.label}</span>
              <h2 className="mt-7 text-3xl">{tier.name}</h2>
              <p className="mt-4 min-h-14 text-ink/60">{tier.desc}</p>
              <p className="mt-7 text-4xl font-semibold">
                ₹{tier.rate}
                <span className="text-sm font-normal text-ink/50"> / meal</span>
              </p>
              <p className="mt-2 text-sm text-ink/50">
                {mealsPerDay} meals × 7 days = <strong className="text-ink">₹{weekly.toLocaleString('en-IN')}</strong> per week
              </p>
              <div className="mt-6">
                <Button href="/signup" variant={i === 1 ? 'solid' : 'outline'} full>
                  Choose {tier.name}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-10 text-center text-sm text-ink/50">
        {mealsPerDay === 3
          ? 'A full three-meal day stays under ₹1,000 with our Weekly and Monthly plans, built for people who already spend that on eating well.'
          : 'Two meals a day keeps a full week under ₹4,300 on our Weekly and Monthly plans.'}
      </p>
    </main>
  );
}
