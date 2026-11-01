'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { MealCard } from '@/components/MealCard';
import { signatureMeals } from '@/lib/meals';

const FILTERS = [
  { id: 'all', label: 'All dishes' },
  { id: 'veg', label: 'Veg' },
  { id: 'egg', label: 'Egg' },
  { id: 'nonveg', label: 'Non-veg' },
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
];

export default function MenuPage() {
  const [filter, setFilter] = useState('all');
  const shown = filter === 'all' ? signatureMeals : signatureMeals.filter((m) => m.diet === filter || m.slot.toLowerCase() === filter);

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="max-w-2xl">
        <p className="mb-4 text-sm font-semibold text-leaf">The Apna Khaana menu</p>
        <h1 className="text-5xl sm:text-6xl">A week worth looking forward to.</h1>
        <p className="mt-6 text-lg leading-8 text-ink/60">
          Indian comfort, dialled into your goals. These are our signature dishes — and inside the
          planner, Sehat composes from 100+ build-a-bowl combinations on top of them.
        </p>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-2xl border border-leaf/25 bg-wash/50 p-4 text-sm text-ink/70 sm:items-center">
        <Sparkles size={18} className="mt-0.5 shrink-0 text-leaf sm:mt-0" />
        <span>
          Not a fixed 30-item menu: choose a base, a protein and a side, and the kitchen composes it to
          order — over 130 goal-fit meals in total. Sign up to build a week your way.
        </span>
      </div>

      <div className="my-10 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              filter === item.id ? 'border-leaf bg-leaf text-white' : 'border-ink/15 text-ink/65 hover:border-leaf hover:text-leaf'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-16 text-center text-ink/50">No dishes match that filter yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      )}
    </main>
  );
}
