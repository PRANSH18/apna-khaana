'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight, RefreshCw, Sparkles, SlidersHorizontal, Shuffle, TrendingUp, Flame,
  Lightbulb, CheckCircle2, AlertTriangle, Brain, RotateCcw, Gauge, HeartPulse,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { AgentExplainer } from '@/components/AgentExplainer';
import { MacroBars } from '@/components/MacroBars';
import { SehatChat } from '@/components/SehatChat';
import { meals, type Meal } from '@/lib/meals';
import { currentWeekStart } from '@/lib/week';
import { savePlan, getHealthProfile, saveHealthProfile, type PlanItem } from '@/lib/store';
import { getSignals, recordSwap, resetSignals, type Signals } from '@/lib/learning';
import {
  computeHealth, ACTIVITY_LABELS, BMI_BAND_LABEL,
  type HealthProfile, type HealthNumbers, type Sex, type Activity,
} from '@/lib/health';
import type { AgentContext } from '@/lib/agent';
import {
  recommendWeek,
  summarizeWeek,
  nextAlternative,
  dietAllows,
  GOAL_LABELS,
  AVOID_LABELS,
  type Goal,
  type DietPref,
  type CuisinePref,
  type AvoidTag,
  type RecommendInput,
  type WeeklySummary,
  type Insight,
  type Emphasis,
  type Targets,
} from '@/lib/recommend';
import {
  customMealsForSlot,
  applyFinish,
  allowedProteins,
  PROTEIN_OPTIONS,
  MEAL_BASE_OPTIONS,
  ADD_ON_OPTIONS,
  type ProteinSource,
  type MealBase,
  type AddOn,
  type CustomizeSelection,
} from '@/lib/customize';

const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const AVOID_OPTIONS: AvoidTag[] = ['paneer', 'tofu', 'egg', 'chicken', 'fish', 'prawn', 'dal'];

type Mode = 'sehat' | 'custom';
type WeekEntry = {
  day: number;
  slot: Meal['slot'];
  template: Meal;
  kcal: number;
  protein: number;
  price: number;
  tags: string[];
  score?: number;
  reasonTag?: string;
};

function slotsFor(mealsPerDay: 2 | 3): Meal['slot'][] {
  return mealsPerDay === 3 ? ['Breakfast', 'Lunch', 'Dinner'] : ['Lunch', 'Dinner'];
}

function buildCustomWeek(selection: CustomizeSelection, mealsPerDay: 2 | 3): WeekEntry[] {
  const slots = slotsFor(mealsPerDay);
  const week: WeekEntry[] = [];
  const poolBySlot: Record<string, Meal[]> = {};
  for (const slot of slots) poolBySlot[slot] = customMealsForSlot(selection, slot);
  for (let day = 0; day < 7; day++) {
    for (const slot of slots) {
      const pool = poolBySlot[slot];
      if (pool.length === 0) continue;
      const template = pool[day % pool.length];
      const result = applyFinish(template, selection);
      week.push({ day, slot, template, kcal: result.kcal, protein: result.protein, price: result.price, tags: result.tags });
    }
  }
  return week;
}

function toggle<T>(list: T[], value: T): T[] {
  if (list.includes(value)) return list.filter((v) => v !== value);
  return [...list, value];
}

const INSIGHT_ICON: Record<Insight['tone'], typeof CheckCircle2> = {
  good: CheckCircle2,
  watch: AlertTriangle,
  tip: Lightbulb,
};
const INSIGHT_COLOR: Record<Insight['tone'], string> = {
  good: 'text-leaf',
  watch: 'text-chili',
  tip: 'text-butter',
};

export default function Plan() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [week, setWeek] = useState<WeekEntry[]>([]);
  const [signals, setSignals] = useState<Signals>({ weights: {}, swaps: 0 });

  // Sehat (AI agent) inputs
  const [goal, setGoal] = useState<Goal>('maintain');
  const [dietA, setDietA] = useState<DietPref>('veg');
  const [cuisine, setCuisine] = useState<CuisinePref>('any');
  const [spiceA, setSpiceA] = useState(2);
  const [oilA, setOilA] = useState(2);
  const [avoidA, setAvoidA] = useState<AvoidTag[]>([]);
  const [mealsPerDayA, setMealsPerDayA] = useState<2 | 3>(3);
  const [emphasisA, setEmphasisA] = useState<Emphasis>(null);
  const [dailyKcalTarget, setDailyKcalTarget] = useState(0);
  const [reason, setReason] = useState('');
  const [summary, setSummary] = useState<WeeklySummary | null>(null);

  // Health profile (drives scientific calorie/protein targets)
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activity, setActivity] = useState<Activity>('light');
  const [targetWeightKg, setTargetWeightKg] = useState('');

  useEffect(() => {
    setSignals(getSignals());
    const saved = getHealthProfile();
    if (saved) {
      setAge(String(saved.age));
      setSex(saved.sex);
      setHeightCm(String(saved.heightCm));
      setWeightKg(String(saved.weightKg));
      setActivity(saved.activity);
      setGoal(saved.goal);
      if (saved.targetWeightKg) setTargetWeightKg(String(saved.targetWeightKg));
    }
  }, []);

  // A profile is "ready" once the three metrics BMR needs are present.
  const profileReady = Number(age) > 0 && Number(heightCm) > 0 && Number(weightKg) > 0;

  function healthProfile(): HealthProfile | null {
    if (!profileReady) return null;
    return {
      age: Number(age),
      sex,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      activity,
      goal,
      targetWeightKg: Number(targetWeightKg) > 0 ? Number(targetWeightKg) : undefined,
    };
  }
  function healthNumbers(): HealthNumbers | null {
    const p = healthProfile();
    return p ? computeHealth(p, mealsPerDayA) : null;
  }
  function targetsFrom(n: HealthNumbers | null): Targets | undefined {
    return n ? { dailyKcal: n.mealCalorieTarget, proteinG: n.mealProteinTargetG } : undefined;
  }
  const [numbers, setNumbers] = useState<HealthNumbers | null>(null);

  // Self-customize inputs (multi-select protein source + meal base)
  const [dietC, setDietC] = useState<DietPref>('veg');
  const [spiceC, setSpiceC] = useState(2);
  const [oilC, setOilC] = useState(2);
  const [proteinsC, setProteinsC] = useState<ProteinSource[]>(['paneer']);
  const [basesC, setBasesC] = useState<MealBase[]>(['rice']);
  const [addOnsC, setAddOnsC] = useState<AddOn[]>([]);
  const [mealsPerDayC, setMealsPerDayC] = useState<2 | 3>(3);

  function sehatInput(): RecommendInput {
    return { goal, diet: dietA, cuisine, spice: spiceA, oil: oilA, mealsPerDay: mealsPerDayA, avoid: avoidA, emphasis: emphasisA };
  }
  function customSelection(): CustomizeSelection {
    return { diet: dietC, spice: spiceC, oil: oilC, proteins: proteinsC, bases: basesC, addOns: addOnsC };
  }

  function applyResult(days: ReturnType<typeof recommendWeek>['days']) {
    setWeek(days.map((d) => ({ day: d.day, slot: d.slot, template: d.meal, kcal: d.meal.kcal, protein: d.meal.protein, price: d.meal.price, tags: ['Sehat pick'], score: d.score, reasonTag: d.reasonTag })));
  }

  // Core Sehat run — accepts an explicit input so chat refinements can regenerate
  // with a merged input before React commits the individual state setters.
  function runSehat(input: RecommendInput, opts: { shuffle?: boolean } = {}) {
    const n = healthNumbers();
    setNumbers(n);
    if (profileReady) saveHealthProfile(healthProfile()!);
    const result = recommendWeek(input, meals, { signals, shuffle: opts.shuffle, targets: targetsFrom(n) });
    applyResult(result.days);
    setDailyKcalTarget(result.dailyKcalTarget);
    setReason(result.reason);
    setSummary(result.summary);
  }

  async function generateSehat() {
    setGenerating(true);
    setMessage('');
    await new Promise((r) => setTimeout(r, 650));
    runSehat(sehatInput());
    setGenerating(false);
    setGenerated(true);
  }

  function shuffleSehat() {
    runSehat(sehatInput(), { shuffle: true });
    setMessage('');
  }

  // Applies a chat command: merge the patch into Sehat's inputs, persist the
  // changed fields to state, and regenerate against the merged input.
  function refineFromChat(patch: Partial<RecommendInput>) {
    const merged: RecommendInput = { ...sehatInput(), ...patch };
    if (patch.goal !== undefined) setGoal(patch.goal);
    if (patch.diet !== undefined) setDietA(patch.diet);
    if (patch.cuisine !== undefined) setCuisine(patch.cuisine);
    if (patch.spice !== undefined) setSpiceA(patch.spice);
    if (patch.oil !== undefined) setOilA(patch.oil);
    if (patch.avoid !== undefined) setAvoidA(patch.avoid);
    if (patch.mealsPerDay !== undefined) setMealsPerDayA(patch.mealsPerDay);
    if (patch.emphasis !== undefined) setEmphasisA(patch.emphasis);
    runSehat(merged);
  }

  function agentContext(): AgentContext {
    return {
      profile: healthProfile(),
      numbers,
      summary,
      input: sehatInput(),
      weekMealCount: week.length,
      weekTotalPrice: week.reduce((s, e) => s + e.price, 0),
    };
  }

  function generateCustom() {
    const selection = customSelection();
    const validProteins = selection.proteins.filter((p) => allowedProteins(selection.diet).includes(p));
    const finalSelection = { ...selection, proteins: validProteins.length ? validProteins : [allowedProteins(selection.diet)[0]] };
    if (finalSelection.proteins.join() !== proteinsC.join()) setProteinsC(finalSelection.proteins);
    setWeek(buildCustomWeek(finalSelection, mealsPerDayC));
    setMessage('');
    setGenerated(true);
  }

  function recomputeSummary(nextWeek: WeekEntry[]) {
    if (mode !== 'sehat') return;
    const asDays = nextWeek.map((e) => ({ day: e.day, slot: e.slot, meal: e.template, score: e.score ?? 0, reasonTag: e.reasonTag ?? '', liveTargetKcal: 0 }));
    setSummary(summarizeWeek(asDays, sehatInput(), targetsFrom(numbers)));
  }

  // Side effects (learning writes, setState) live here, NOT inside a setWeek
  // updater — React's dev StrictMode double-invokes updaters to detect impurity,
  // which previously fired recordSwap twice per click. Reading `week` from the
  // render closure keeps this pure and single-fire.
  function swap(index: number) {
    const entry = week[index];
    if (mode === 'sehat') {
      const next = nextAlternative(entry.template, entry.slot, sehatInput(), meals, signals);
      const learned = recordSwap(entry.template.id, next.id); // teach: rejected old, accepted new
      setSignals(learned);
      const nextWeek = week.map((e, i) => (i === index ? { ...e, template: next, kcal: next.kcal, protein: next.protein, price: next.price, reasonTag: 'You swapped this in' } : e));
      setWeek(nextWeek);
      recomputeSummary(nextWeek);
      return;
    }
    const pool = customMealsForSlot(customSelection(), entry.slot);
    const idx = pool.findIndex((m) => m.name === entry.template.name);
    const nextTemplate = pool[(idx + 1) % pool.length] ?? pool[0];
    const result = applyFinish(nextTemplate, customSelection());
    setWeek(week.map((e, i) => (i === index ? { ...e, template: nextTemplate, kcal: result.kcal, protein: result.protein, price: result.price, tags: result.tags } : e)));
  }

  function forgetLearning() {
    setSignals(resetSignals());
    setMessage('Sehat reset — it will learn from your swaps again.');
  }

  function toPlanRecord(): { weekStart: string; mealsPerDay: 2 | 3; mode: Mode; items: PlanItem[]; locked: boolean } {
    return {
      weekStart: currentWeekStart(),
      mealsPerDay: mode === 'sehat' ? mealsPerDayA : mealsPerDayC,
      mode: mode || 'sehat',
      items: week.map((e) => ({ day: e.day, slot: e.slot.toLowerCase(), mealId: e.template.id, name: e.template.name, kcal: e.kcal, protein: e.protein, price: e.price })),
      locked: false,
    };
  }

  async function doSave(): Promise<boolean> {
    const result = await savePlan(toPlanRecord());
    if (!result.ok) {
      setMessage(result.error || 'Could not save your plan.');
      return false;
    }
    return true;
  }

  async function savePlanClick() {
    setSaving(true);
    const ok = await doSave();
    setSaving(false);
    if (ok) setMessage('Plan saved.');
  }

  async function continueToCheckout() {
    setSaving(true);
    const ok = await doSave();
    setSaving(false);
    if (ok) location.href = '/app/checkout';
  }

  function reset() {
    setMode(null);
    setGenerated(false);
    setMessage('');
  }

  const weekTotalPrice = week.reduce((s, e) => s + e.price, 0);
  const days = Array.from(new Set(week.map((e) => e.day))).sort((a, b) => a - b);

  return (
    <div className="pb-4">
      <p className="text-sm font-semibold text-leaf">The weekly planner</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">A plan that knows your preferences.</h1>

      {/* Path picker */}
      {!mode && (
        <section className="mt-10 grid gap-5 sm:grid-cols-2">
          <button
            onClick={() => setMode('custom')}
            className="rounded-3xl border border-ink/15 bg-white p-7 text-left shadow-card transition hover:-translate-y-1 hover:border-leaf hover:shadow-soft"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-wash">
              <SlidersHorizontal className="text-leaf" size={22} />
            </div>
            <h2 className="mt-6 text-2xl sm:text-3xl">Build it yourself</h2>
            <p className="mt-3 leading-7 text-ink/60">
              Pick one or more protein sources, meal bases, spice, oil and add-ons. The week rotates
              through everything you pick — entirely your call, no recommendation involved.
            </p>
          </button>
          <button
            onClick={() => setMode('sehat')}
            className="relative overflow-hidden rounded-3xl border border-ink/15 bg-white p-7 text-left shadow-card transition hover:-translate-y-1 hover:border-leaf hover:shadow-soft"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-wash">
              <Sparkles className="text-leaf" size={22} />
            </div>
            <h2 className="mt-6 text-2xl sm:text-3xl">Let Sehat recommend</h2>
            <p className="mt-3 leading-7 text-ink/60">
              Tell Sehat your goal and diet. It balances protein, carbs and fat against your goal,
              adapts your calorie budget through the day, and learns from every swap you make.
            </p>
            {signals.swaps > 0 && (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-wash px-3 py-1 text-xs font-semibold text-leaf">
                <Brain size={13} /> Personalised from {signals.swaps} {signals.swaps === 1 ? 'swap' : 'swaps'}
              </span>
            )}
          </button>
        </section>
      )}

      {/* Forms */}
      {mode && !generated && (
        <section className="mt-10 max-w-2xl rounded-3xl border border-ink/10 bg-white p-7 shadow-card sm:p-8">
          <button onClick={reset} className="text-sm font-semibold text-leaf">
            &larr; Choose a different path
          </button>

          {mode === 'sehat' ? (
            <>
              <h2 className="mt-6 text-3xl">About you</h2>
              <p className="mt-1 text-sm text-ink/50">So Sehat can compute real calorie and protein targets from your body, not a guess.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Age
                  <input type="number" min={14} max={90} value={age} onChange={(e) => setAge(e.target.value)} placeholder="28" className="mt-2 w-full rounded-xl border border-ink/20 px-3 py-2.5 focus:border-leaf" />
                </label>
                <div className="block text-sm font-semibold">
                  Sex
                  <div className="mt-2 flex gap-2">
                    {(['male', 'female'] as Sex[]).map((s) => (
                      <button key={s} type="button" onClick={() => setSex(s)} className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium capitalize ${sex === s ? 'border-leaf bg-wash text-leaf' : 'border-ink/15 text-ink/70'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <label className="block text-sm font-semibold">
                  Height (cm)
                  <input type="number" min={130} max={220} value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="172" className="mt-2 w-full rounded-xl border border-ink/20 px-3 py-2.5 focus:border-leaf" />
                </label>
                <label className="block text-sm font-semibold">
                  Weight (kg)
                  <input type="number" min={35} max={200} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="74" className="mt-2 w-full rounded-xl border border-ink/20 px-3 py-2.5 focus:border-leaf" />
                </label>
              </div>
              <div className="mt-5">
                <p className="text-sm font-semibold">Activity level</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(ACTIVITY_LABELS) as Activity[]).map((a) => (
                    <button key={a} type="button" onClick={() => setActivity(a)} className={`rounded-full border px-3.5 py-2 text-xs font-medium ${activity === a ? 'border-leaf bg-leaf text-white' : 'border-ink/15 text-ink/70'}`}>
                      {ACTIVITY_LABELS[a]}
                    </button>
                  ))}
                </div>
              </div>

              <h2 className="mt-9 text-3xl">What are you working towards?</h2>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {(['lose', 'maintain', 'build'] as Goal[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`rounded-xl border p-4 text-left text-sm font-medium transition ${goal === g ? 'border-leaf bg-wash text-leaf' : 'border-ink/15 text-ink/70 hover:border-leaf/50'}`}
                  >
                    {GOAL_LABELS[g]}
                  </button>
                ))}
              </div>
              {goal !== 'maintain' && (
                <label className="mt-5 block max-w-xs text-sm font-semibold">
                  Target weight (kg, optional)
                  <input type="number" min={35} max={200} value={targetWeightKg} onChange={(e) => setTargetWeightKg(e.target.value)} placeholder="68" className="mt-2 w-full rounded-xl border border-ink/20 px-3 py-2.5 focus:border-leaf" />
                </label>
              )}

              {profileReady && <NumbersPreview numbers={computeHealth(healthProfile()!, mealsPerDayA)} goal={goal} />}

              <h2 className="mt-9 text-3xl">What do you eat?</h2>
              <div className="mt-7 flex flex-wrap gap-2">
                {([['veg', 'Vegetarian'], ['egg', 'Egg-friendly'], ['nonveg', 'Everything']] as [DietPref, string][]).map(([v, l]) => (
                  <button key={v} onClick={() => setDietA(v)} className={`rounded-full border px-4 py-2 text-sm ${dietA === v ? 'border-leaf bg-leaf text-white' : 'border-ink/15'}`}>
                    {l}
                  </button>
                ))}
              </div>

              <h2 className="mt-9 text-3xl">Cuisine lean</h2>
              <div className="mt-7 flex flex-wrap gap-2">
                {(['any', 'north', 'south', 'west'] as CuisinePref[]).map((c) => (
                  <button key={c} onClick={() => setCuisine(c)} className={`rounded-full border px-4 py-2 text-sm capitalize ${cuisine === c ? 'border-leaf bg-leaf text-white' : 'border-ink/15'}`}>
                    {c}
                  </button>
                ))}
              </div>

              <div className="mt-9 grid gap-7 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Spice preference ({spiceA}/4)
                  <input type="range" min={1} max={4} value={spiceA} onChange={(e) => setSpiceA(Number(e.target.value))} className="mt-3 w-full accent-leaf" />
                </label>
                <label className="block text-sm font-semibold">
                  Oil preference ({oilA}/3)
                  <input type="range" min={1} max={3} value={oilA} onChange={(e) => setOilA(Number(e.target.value))} className="mt-3 w-full accent-leaf" />
                </label>
              </div>

              <h2 className="mt-9 text-3xl">Anything to avoid?</h2>
              <p className="mt-1 text-sm text-ink/50">Optional — Sehat filters these out of every pick.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {AVOID_OPTIONS.map((a) => (
                  <button key={a} onClick={() => setAvoidA((cur) => toggle(cur, a))} className={`rounded-full border px-4 py-2 text-sm ${avoidA.includes(a) ? 'border-danger bg-danger text-white' : 'border-ink/15'}`}>
                    {AVOID_LABELS[a]}
                  </button>
                ))}
              </div>

              <h2 className="mt-9 text-3xl">Meals per day</h2>
              <div className="mt-7 flex gap-2">
                {[2, 3].map((n) => (
                  <button key={n} onClick={() => setMealsPerDayA(n as 2 | 3)} className={`rounded-full border px-4 py-2 text-sm ${mealsPerDayA === n ? 'border-leaf bg-leaf text-white' : 'border-ink/15'}`}>
                    {n} meals/day
                  </button>
                ))}
              </div>

              <div className="mt-9">
                <Button onClick={generateSehat} disabled={generating}>
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin" /> Sehat is scoring your week…
                    </span>
                  ) : (
                    <>
                      Let Sehat build my week <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-6 text-3xl">What do you eat?</h2>
              <div className="mt-7 flex flex-wrap gap-2">
                {([['veg', 'Vegetarian'], ['egg', 'Egg-friendly'], ['nonveg', 'Everything']] as [DietPref, string][]).map(([v, l]) => (
                  <button key={v} onClick={() => setDietC(v)} className={`rounded-full border px-4 py-2 text-sm ${dietC === v ? 'border-leaf bg-leaf text-white' : 'border-ink/15'}`}>
                    {l}
                  </button>
                ))}
              </div>

              <h2 className="mt-9 text-3xl">Protein sources</h2>
              <p className="mt-1 text-sm text-ink/50">Pick as many as you like — the week rotates through all of them.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {allowedProteins(dietC).map((p) => (
                  <button key={p} onClick={() => setProteinsC((cur) => toggle(cur, p))} className={`rounded-full border px-4 py-2 text-sm ${proteinsC.includes(p) ? 'border-leaf bg-leaf text-white' : 'border-ink/15'}`}>
                    {PROTEIN_OPTIONS[p].label}
                  </button>
                ))}
              </div>

              <h2 className="mt-9 text-3xl">Meal bases</h2>
              <p className="mt-1 text-sm text-ink/50">Also multi-select — mix rice, quinoa and roti through the week.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(Object.keys(MEAL_BASE_OPTIONS) as MealBase[]).map((b) => (
                  <button key={b} onClick={() => setBasesC((cur) => toggle(cur, b))} className={`rounded-full border px-4 py-2 text-sm ${basesC.includes(b) ? 'border-leaf bg-leaf text-white' : 'border-ink/15'}`}>
                    {MEAL_BASE_OPTIONS[b].label}
                  </button>
                ))}
              </div>

              <div className="mt-9 grid gap-7 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Spice level ({spiceC}/4)
                  <input type="range" min={1} max={4} value={spiceC} onChange={(e) => setSpiceC(Number(e.target.value))} className="mt-3 w-full accent-leaf" />
                </label>
                <label className="block text-sm font-semibold">
                  Oil level ({oilC}/3)
                  <input type="range" min={1} max={3} value={oilC} onChange={(e) => setOilC(Number(e.target.value))} className="mt-3 w-full accent-leaf" />
                </label>
              </div>

              <h2 className="mt-9 text-3xl">Nutritional add-ons</h2>
              <div className="mt-7 flex flex-wrap gap-2">
                {(Object.keys(ADD_ON_OPTIONS) as AddOn[]).map((a) => (
                  <button key={a} onClick={() => setAddOnsC((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]))} className={`rounded-full border px-4 py-2 text-sm ${addOnsC.includes(a) ? 'border-leaf bg-leaf text-white' : 'border-ink/15'}`}>
                    {ADD_ON_OPTIONS[a].label}
                  </button>
                ))}
              </div>

              <h2 className="mt-9 text-3xl">Meals per day</h2>
              <div className="mt-7 flex gap-2">
                {[2, 3].map((n) => (
                  <button key={n} onClick={() => setMealsPerDayC(n as 2 | 3)} className={`rounded-full border px-4 py-2 text-sm ${mealsPerDayC === n ? 'border-leaf bg-leaf text-white' : 'border-ink/15'}`}>
                    {n} meals/day
                  </button>
                ))}
              </div>

              <div className="mt-9">
                <Button onClick={generateCustom}>
                  Build my week <ArrowRight size={16} />
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      {/* Results */}
      {mode && generated && (
        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white p-5 shadow-card">
            <div className="min-w-0">
              <p className="font-semibold">
                {mode === 'sehat' ? reason : `Your build: ${proteinsC.map((p) => PROTEIN_OPTIONS[p].label).join(' + ')} · ${basesC.map((b) => MEAL_BASE_OPTIONS[b].label).join(' + ')}`}
              </p>
              <p className="mt-1 text-sm text-ink/60">
                {week.length} meals this week · ₹{weekTotalPrice.toLocaleString('en-IN')} total
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              {mode === 'sehat' && (
                <button onClick={shuffleSehat} className="flex items-center gap-2 text-sm font-semibold text-leaf">
                  <Shuffle size={16} /> Shuffle
                </button>
              )}
              <button onClick={() => setGenerated(false)} className="flex items-center gap-2 text-sm font-semibold text-leaf">
                <RefreshCw size={16} /> Adjust
              </button>
            </div>
          </div>

          {/* AI analytics */}
          {mode === 'sehat' && summary && (
            <>
              <div className="mt-6 flex flex-wrap items-center gap-5 rounded-2xl border border-ink/10 bg-ink p-5 text-paper shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-paper/10">
                    <Gauge size={22} className="text-butter" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.08em] text-paper/50">Plan Fit</p>
                    <p className="text-3xl font-semibold">{summary.fitScore}<span className="text-lg text-paper/50">/100</span></p>
                  </div>
                </div>
                <div className="flex flex-1 flex-wrap gap-x-6 gap-y-1 text-xs text-paper/70">
                  <span>Calories {Math.round(summary.fitParts.calorie * 100)}%</span>
                  <span>Macros {Math.round(summary.fitParts.macro * 100)}%</span>
                  <span>Variety {Math.round(summary.fitParts.variety * 100)}%</span>
                  <span>Preferences {Math.round(summary.fitParts.preference * 100)}%</span>
                </div>
                <p className="w-full text-xs text-paper/50">Sehat&apos;s own grade of how well this week serves your goal and tastes — the blend of the four measures above.</p>
              </div>

              {numbers && (
                <p className="mt-3 text-sm text-ink/55">
                  Measured against your body: ~{numbers.mealCalorieTarget} kcal &amp; ~{numbers.mealProteinTargetG}g protein/day from your meals (goal {numbers.goalCalories} kcal, BMR {numbers.bmr}).
                </p>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-card">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.08em] text-ink/45">
                    <Flame size={13} /> Weekly total
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{summary.totalKcal.toLocaleString('en-IN')} kcal</p>
                  <p className="text-sm text-ink/50">{summary.totalProtein}g protein across {week.length} meals</p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-card">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.08em] text-ink/45">
                    <TrendingUp size={13} /> Per-meal average
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{summary.avgKcalPerMeal} kcal</p>
                  <p className="text-sm text-ink/50">{summary.avgProteinPerMeal}g protein per meal</p>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-[.08em] text-ink/45">On target</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{Math.round(summary.onTargetShare * 100)}%</p>
                  <p className="text-sm text-ink/50">of days within 10% of your ~{dailyKcalTarget} kcal target</p>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1.2fr]">
                <MacroBars planned={summary.plannedMacro} ideal={summary.idealMacro} />
                <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-[.08em] text-ink/45">Sehat&apos;s read on this week</p>
                  <ul className="mt-3 space-y-3">
                    {summary.insights.map((ins, i) => {
                      const Icon = INSIGHT_ICON[ins.tone];
                      return (
                        <li key={i} className="flex gap-2.5 text-sm leading-6 text-ink/70">
                          <Icon size={16} className={`mt-0.5 shrink-0 ${INSIGHT_COLOR[ins.tone]}`} />
                          <span>{ins.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                  {signals.swaps > 0 && (
                    <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-4">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-leaf">
                        <Brain size={13} /> Personalised from {signals.swaps} {signals.swaps === 1 ? 'swap' : 'swaps'}
                      </span>
                      <button onClick={forgetLearning} className="flex items-center gap-1 text-xs font-semibold text-ink/40 hover:text-danger">
                        <RotateCcw size={12} /> Reset
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <AgentExplainer input={sehatInput()} dailyKcalTarget={dailyKcalTarget} swaps={signals.swaps} />
              </div>
            </>
          )}

          {/* Day-grouped docket */}
          <div className="mt-6 space-y-5">
            {days.map((day) => {
              const dayMeals = week.map((e, i) => ({ e, i })).filter(({ e }) => e.day === day);
              const dayKcal = dayMeals.reduce((s, { e }) => s + e.kcal, 0);
              return (
                <div key={day}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold">{DAY_LABELS[day]}</h3>
                    <span className="text-xs font-medium text-ink/40">{dayKcal} kcal</span>
                  </div>
                  <div className="grid gap-3">
                    {dayMeals.map(({ e: entry, i }) => (
                      <div
                        key={`${entry.template.id}-${entry.day}-${entry.slot}`}
                        className="reveal flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-3 shadow-card transition sm:p-4"
                      >
                        <span className="w-16 shrink-0 text-xs font-semibold uppercase tracking-[.06em] text-ink/40">{entry.slot}</span>
                        <img src={entry.template.image} alt="" className="h-16 w-20 shrink-0 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{entry.template.name}</p>
                          <p className="text-sm text-ink/50">{entry.kcal} kcal · {entry.protein}g protein · ₹{entry.price}</p>
                          {mode === 'custom' && <p className="mt-1 truncate text-xs text-ink/45">{entry.tags.join(' · ')}</p>}
                          {mode === 'sehat' && entry.reasonTag && <p className="mt-1 truncate text-xs text-ink/45">{entry.reasonTag}</p>}
                        </div>
                        {mode === 'sehat' && typeof entry.score === 'number' && (
                          <span className="hidden shrink-0 rounded-full bg-wash px-2.5 py-1 text-xs font-semibold text-leaf sm:block">{entry.score}% match</span>
                        )}
                        <button onClick={() => swap(i)} className="shrink-0 rounded-full bg-wash px-3 py-2 text-sm font-semibold text-leaf transition hover:bg-leaf hover:text-white">
                          Swap
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-[76px] z-10 mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-ink/10 bg-paper/95 p-4 shadow-card backdrop-blur md:bottom-4">
            <Button onClick={savePlanClick} variant="outline" disabled={saving}>
              {saving ? 'Saving…' : 'Save for later'}
            </Button>
            <Button onClick={continueToCheckout} disabled={saving}>
              {saving ? 'Saving…' : 'Confirm & checkout'} <ArrowRight size={16} />
            </Button>
            {message && <p className="text-sm font-semibold text-leaf">{message}</p>}
          </div>

          {mode === 'sehat' && <SehatChat getContext={agentContext} onRefine={refineFromChat} />}
        </section>
      )}
    </div>
  );
}

function NumbersPreview({ numbers: n, goal }: { numbers: HealthNumbers; goal: Goal }) {
  return (
    <div className="mt-8 rounded-2xl border border-leaf/30 bg-wash/50 p-5">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.08em] text-leaf">
        <HeartPulse size={13} /> Your numbers
      </p>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Stat label="BMI" value={`${n.bmi}`} sub={BMI_BAND_LABEL[n.bmiBand]} />
        <Stat label="BMR" value={`${n.bmr}`} sub="kcal at rest" />
        <Stat label="Maintenance" value={`${n.tdee}`} sub="kcal/day (TDEE)" />
        <Stat label="Goal calories" value={`${n.goalCalories}`} sub="kcal/day" />
      </div>
      <div className="mt-4 rounded-xl border border-ink/10 bg-white p-3.5 text-sm leading-6 text-ink/70">
        Your Apna Khaana meals are set to deliver <strong className="text-ink">{n.mealCalorieTarget} kcal</strong> and{' '}
        <strong className="text-ink">{n.mealProteinTargetG}g protein</strong> a day ({Math.round(n.mealShare * 100)}% of your target —
        the rest is your home food and snacks).
        {goal !== 'maintain' && n.timelineWeeks && (
          <> At this pace you would {n.weeklyWeightChangeKg < 0 ? 'lose' : 'gain'} about {Math.abs(n.weeklyWeightChangeKg).toFixed(2)} kg/week, reaching your target in ~{n.timelineWeeks} weeks.</>
        )}
      </div>
      <p className="mt-2 text-[11px] text-ink/40">Estimates via the Mifflin-St Jeor equation. Not medical advice.</p>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[.06em] text-ink/40">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-ink">{value}</p>
      <p className="text-[11px] text-ink/45">{sub}</p>
    </div>
  );
}
