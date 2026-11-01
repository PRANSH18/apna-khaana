import { Flame, Beef } from 'lucide-react';
import type { Meal } from '@/lib/meals';

const DIET_STYLE: Record<Meal['diet'], string> = {
  veg: 'bg-leaf text-white',
  egg: 'bg-butter text-ink',
  nonveg: 'bg-chili text-white',
};

const DIET_LABEL: Record<Meal['diet'], string> = {
  veg: 'Veg',
  egg: 'Egg',
  nonveg: 'Non-veg',
};

export function MealCard({ meal }: { meal: Meal }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={meal.image}
          alt={meal.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${DIET_STYLE[meal.diet]}`}>
          {DIET_LABEL[meal.diet]}
        </span>
        <span className="absolute bottom-3 left-3 text-xs font-semibold uppercase tracking-[.1em] text-white">
          {meal.slot}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-semibold text-ink">{meal.name}</h3>
        <p className="mt-2 text-sm leading-6 text-ink/60">{meal.note}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink/70">
          <span className="inline-flex items-center gap-1 rounded-full bg-wash px-2.5 py-1">
            <Flame size={13} className="text-chili" /> {meal.kcal} kcal
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-wash px-2.5 py-1">
            <Beef size={13} className="text-leaf" /> {meal.protein}g protein
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
          <span className="text-lg font-semibold text-ink">₹{meal.price}</span>
          <span className="text-xs font-medium text-ink/45">per serving</span>
        </div>
      </div>
    </article>
  );
}
