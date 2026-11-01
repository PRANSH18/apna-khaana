import { Button } from '@/components/Button';
import { Check, ChefHat, SlidersHorizontal, Sparkles } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    title: 'Choose your path',
    body: 'Build every meal yourself across five levers — spice, oil, protein source, meal base and add-ons — or let Sehat, our recommender, propose a week from your goal.',
    icon: SlidersHorizontal,
  },
  {
    n: '02',
    title: 'Shape your week',
    body: 'Get a thoughtful starting point either way. Swap any meal, for any reason. You are always the final editor.',
    icon: Check,
  },
  {
    n: '03',
    title: 'We cook to your plan',
    body: 'Confirm by Sunday. We source and cook exactly what your week calls for, then deliver across Bengaluru.',
    icon: ChefHat,
  },
];

export default function How() {
  return (
    <main>
      <section className="bg-ink px-6 py-20 text-paper">
        <div className="mx-auto max-w-6xl">
          <p className="mb-5 text-sm font-semibold text-butter">The Apna Khaana way</p>
          <h1 className="max-w-3xl text-5xl leading-tight sm:text-6xl">
            A calmer week, served one meal at a time.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-paper/70">
            You set the direction, one of two ways. Our kitchen does the cooking.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ n, title, body, icon: Icon }) => (
            <div key={n} className="rounded-2xl border border-ink/10 bg-white p-7 shadow-card">
              <span className="text-sm font-semibold text-chili">{n}</span>
              <Icon className="my-6 text-leaf" size={28} />
              <h2 className="text-2xl">{title}</h2>
              <p className="mt-3 leading-7 text-ink/60">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 rounded-3xl border border-ink/10 bg-white p-8 shadow-soft md:grid-cols-[auto_1fr] md:p-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-wash">
            <Sparkles className="text-leaf" size={24} />
          </div>
          <div>
            <p className="text-sm font-semibold text-leaf">Meet Sehat</p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Your optional recommender, not a nutritionist.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-ink/65">
              Sehat is a rules-based advisor, not a medical tool. It only ever sees two things: the
              menu&apos;s own calorie, protein, spice and oil data, and the goal, diet and spice/oil
              preference you state. From your goal it sets a per-meal calorie and protein target,
              scores every eligible dish against it, and proposes a week that rotates so nothing
              repeats within three days. Every number it uses is visible in the planner, and every
              meal it picks stays swappable. If you would rather skip the recommendation entirely, the
              five-lever self-customize path builds your week with no scoring at all — just your own
              choices.
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-3xl bg-wash p-8 md:p-12">
          <p className="text-sm font-semibold text-leaf">The Sunday promise</p>
          <h2 className="mt-4 text-3xl sm:text-4xl">Your plan locks at 11:59pm every Sunday.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-ink/65">
            That gives our kitchen a clear, honest window to source better ingredients and cook with
            less waste. After lock, your week is ready to go. You can shape next week&apos;s plan any
            time.
          </p>
          <div className="mt-8">
            <Button href="/signup">Build a week</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
