import Link from 'next/link';
import { ArrowUpRight, Check, Clock3, Leaf, Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';
import { MealCard } from '@/components/MealCard';
import { meals } from '@/lib/meals';

const FEATURED_IDS = ['idli-sambar', 'chicken-biryani', 'kadai-paneer', 'malabar-chicken'];

export default function Home() {
  const hero = meals.find((m) => m.id === 'chicken-bowl') ?? meals[0];
  const featured = FEATURED_IDS.map((id) => meals.find((m) => m.id === id)).filter((m): m is (typeof meals)[number] => !!m);

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-12 md:grid-cols-[.9fr_1.1fr] md:items-center md:pt-16">
        <div className="reveal">
          <p className="mb-5 flex items-center gap-2 text-sm font-semibold text-leaf">
            <Leaf size={15} /> A better week starts at lunch
          </p>
          <h1 className="max-w-xl text-5xl leading-[1.03] sm:text-6xl">
            Food that fits the life you are building.
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-ink/65">
            Personalised Indian meals for Bengaluru&apos;s early professionals, planned around your
            goals and cooked fresh. Self-customise every lever, or let Sehat build your week for you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/signup">
              Build my week <ArrowUpRight size={16} />
            </Button>
            <Button href="/how-it-works" variant="outline">
              See how it works
            </Button>
          </div>
          <p className="mt-5 text-xs font-medium text-ink/45">
            No commitment on your first week. From ₹280 per meal.
          </p>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden rounded-3xl shadow-soft">
            <img src={hero.image} alt={hero.name} className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-6 left-6 rounded-2xl bg-white p-4 shadow-card sm:left-8">
            <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-ink/45">
              This week&apos;s favourite
            </p>
            <p className="mt-1 font-display text-xl">{hero.name}</p>
          </div>
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-leaf shadow-card">
            <Sparkles size={13} /> Sehat-recommended
          </div>
        </div>
      </section>

      <section className="grain border-y border-ink/10 bg-wash/60 px-6 py-7">
        <div className="mx-auto grid max-w-6xl gap-5 text-sm sm:grid-cols-3">
          <div className="flex gap-3">
            <Clock3 className="mt-0.5 shrink-0 text-leaf" size={19} />
            <span>
              <strong>Locks Sunday</strong>
              <br />
              We source to your exact week.
            </span>
          </div>
          <div className="flex gap-3">
            <Check className="mt-0.5 shrink-0 text-leaf" size={19} />
            <span>
              <strong>You stay in control</strong>
              <br />
              Swap anything Sehat suggests.
            </span>
          </div>
          <div className="flex gap-3">
            <Leaf className="mt-0.5 shrink-0 text-leaf" size={19} />
            <span>
              <strong>Made in Bengaluru</strong>
              <br />
              Fresh ingredients, transparent sourcing.
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold text-leaf">A taste of the menu</p>
            <h2 className="text-4xl sm:text-5xl">Good food, made personal.</h2>
          </div>
          <Link href="/menu" className="hidden items-center gap-1 text-sm font-semibold text-leaf sm:flex">
            Browse the full menu <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
        <Link href="/menu" className="mt-8 flex items-center gap-1 text-sm font-semibold text-leaf sm:hidden">
          Browse the full menu <ArrowUpRight size={15} />
        </Link>
      </section>

      <section className="bg-ink px-6 py-20 text-paper">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-end">
          <div>
            <p className="mb-4 text-sm font-semibold text-butter">The weekly rhythm</p>
            <h2 className="text-4xl leading-tight sm:text-5xl">
              Less deciding.
              <br />
              More living.
            </h2>
          </div>
          <div>
            <p className="max-w-md text-lg leading-8 text-paper/70">
              Tell us where you want to go. We map a week of meals to help you get there, then leave
              the final say with you.
            </p>
            <div className="mt-7">
              <Button href="/signup">Start with your goals</Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
