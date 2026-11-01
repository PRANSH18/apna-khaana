// Sehat — the rules-based, self-adapting meal recommender.
//
// Not a black box: every number below is a plain, inspectable rule over the
// catalog's own macro/spice/oil data plus the preferences the customer states.
// No biometric or medical input, no medical claims — see AgentExplainer.tsx.
//
// Four ideas make this more than a static lookup:
//
// 1. Macro fit. Each goal carries an ideal split of calories across
//    protein/carb/fat (a sports-nutrition-style ratio, not a prescription),
//    and a dish is scored on how close its OWN split sits to that ideal —
//    using all three macros the catalog publishes, not protein alone.
//
// 2. An adaptive daily calorie budget. Sehat doesn't chase one fixed per-meal
//    number all day; it tracks what a day has already spent and divides what
//    is LEFT by the slots still to fill, so a rich breakfast lowers the lunch
//    and dinner targets, the way a person planning their own day would.
//
// 3. Learned preference signals. Swaps teach it (see lib/learning.ts): a
//    small, capped nudge folds the customer's own accept/reject history back
//    into the score, so the week bends toward what they keep over time.
//
// 4. Explainable output. A per-dish reason tag, a weekly macro breakdown vs
//    the goal ideal, and generated insights that read like an advisor's notes.

import type { Meal } from './meals';
import { learnedNudge, type Signals } from './learning';

export type Goal = 'lose' | 'maintain' | 'build';
export type DietPref = 'veg' | 'egg' | 'nonveg';
export type CuisinePref = 'any' | 'north' | 'south' | 'west';
export type AvoidTag = 'paneer' | 'tofu' | 'egg' | 'chicken' | 'fish' | 'prawn' | 'dal';

export type Emphasis = 'protein' | 'lighter' | null;

export type RecommendInput = {
  goal: Goal;
  diet: DietPref;
  cuisine: CuisinePref;
  spice: number; // 1-4 preferred spice level
  oil: number; // 1-3 preferred oil level
  mealsPerDay: 2 | 3;
  avoid: AvoidTag[];
  emphasis?: Emphasis; // a natural-language nudge from the chat: favour protein density, or lighter meals
};

export type PlannedMeal = { day: number; slot: Meal['slot']; meal: Meal; score: number; reasonTag: string; liveTargetKcal: number };

export type MacroSplit = { protein: number; carb: number; fat: number };

export type Insight = { tone: 'good' | 'watch' | 'tip'; text: string };

export type FitParts = { calorie: number; macro: number; variety: number; preference: number };

export type WeeklySummary = {
  totalKcal: number;
  totalProtein: number;
  avgKcalPerMeal: number;
  avgProteinPerMeal: number;
  onTargetShare: number; // 0-1, share of days within 10% of the daily calorie target
  cuisineSpread: Record<string, number>;
  plannedMacro: MacroSplit; // actual protein/carb/fat calorie shares of the built week
  idealMacro: MacroSplit; // the goal's target split, for side-by-side display
  insights: Insight[];
  fitScore: number; // 0-100 composite: how well this week serves the stated goal + preferences
  fitParts: FitParts; // the four 0-1 components behind the score, for a transparent breakdown
  dailyKcalTarget: number; // the target the week was measured against (personalized if a profile exists)
  proteinTargetG: number; // daily protein the meals should deliver (0 if no profile)
};

// Personalized targets derived from a health profile (lib/health.ts). When
// absent, Sehat falls back to the goal defaults in GOAL_TARGETS.
export type Targets = { dailyKcal: number; proteinG: number };

export type RecommendResult = {
  days: PlannedMeal[];
  targetKcalPerMeal: number;
  targetProteinPerMeal: number;
  dailyKcalTarget: number;
  reason: string;
  summary: WeeklySummary;
};

const GOAL_TARGETS: Record<Goal, { dailyKcal: number; macro: MacroSplit; label: string }> = {
  lose: { dailyKcal: 1150, macro: { protein: 0.35, carb: 0.35, fat: 0.30 }, label: 'steady, sustainable weight loss' },
  maintain: { dailyKcal: 1300, macro: { protein: 0.25, carb: 0.45, fat: 0.30 }, label: 'your everyday balance' },
  build: { dailyKcal: 1400, macro: { protein: 0.30, carb: 0.45, fat: 0.25 }, label: 'building strength' },
};

const SLOTS_BY_COUNT: Record<2 | 3, Meal['slot'][]> = {
  2: ['Lunch', 'Dinner'],
  3: ['Breakfast', 'Lunch', 'Dinner'],
};

const DAYS = 7;
const VARIETY_WINDOW = 3;
const MIN_LIVE_TARGET = 150;

export function dietAllows(meal: Meal, diet: DietPref): boolean {
  if (diet === 'veg') return meal.diet === 'veg';
  if (diet === 'egg') return meal.diet === 'veg' || meal.diet === 'egg';
  return true;
}

function avoidsAllow(meal: Meal, avoid: AvoidTag[]): boolean {
  if (!avoid.length) return true;
  const name = meal.name.toLowerCase();
  return !avoid.some((tag) => name.includes(tag));
}

type ScoreBreakdown = { total: number; base: number; macro: number; kcal: number; cuisine: number; spice: number; oil: number; learned: number };

// Base score is 0-100 (macro 35, calories 30, cuisine 15, spice 10, oil 10);
// a learned nudge (bounded ±8) is added on top and reflected in `total`.
function scoreMeal(meal: Meal, liveTargetKcal: number, input: RecommendInput, signals?: Signals): ScoreBreakdown {
  const { cuisine, spice, oil } = input;
  const { macro } = GOAL_TARGETS[input.goal];

  const proteinShare = (meal.protein * 4) / meal.kcal;
  const carbShare = (meal.carbs * 4) / meal.kcal;
  const fatShare = (meal.fat * 9) / meal.kcal;
  const macroDiff = Math.abs(proteinShare - macro.protein) + Math.abs(carbShare - macro.carb) + Math.abs(fatShare - macro.fat);
  const macroScore = Math.max(0, 1 - macroDiff);

  const kcalScore = Math.max(0, 1 - Math.abs(meal.kcal - liveTargetKcal) / liveTargetKcal);
  const cuisineScore = cuisine === 'any' || meal.cuisine === cuisine ? 1 : 0.4;
  const spiceScore = Math.max(0, 1 - Math.abs(meal.spice - spice) / 3);
  const oilScore = Math.max(0, 1 - Math.abs(meal.oil - oil) / 2);

  const macro35 = macroScore * 35;
  const kcal30 = kcalScore * 30;
  const cuisine15 = cuisineScore * 15;
  const spice10 = spiceScore * 10;
  const oil10 = oilScore * 10;
  const base = macro35 + kcal30 + cuisine15 + spice10 + oil10;
  const learned = learnedNudge(signals, meal.id);

  // Chat-driven emphasis: a bounded bonus that re-shapes the week when the
  // customer asks for "more protein" or "lighter" in the conversational agent.
  let emphasis = 0;
  if (input.emphasis === 'protein') emphasis = Math.min(12, (meal.protein / meal.kcal) * 130);
  else if (input.emphasis === 'lighter') emphasis = Math.max(0, Math.min(12, 12 * (1 - (meal.kcal - 250) / 400)));

  return { total: base + learned + emphasis, base, macro: macro35, kcal: kcal30, cuisine: cuisine15, spice: spice10, oil: oil10, learned };
}

const REASON_LABELS: Record<'macro' | 'kcal' | 'cuisine' | 'spice' | 'oil' | 'learned', string> = {
  macro: 'Best macro balance for your goal',
  kcal: "Right on today's remaining calorie budget",
  cuisine: 'Matches your cuisine lean',
  spice: 'Matches your spice preference',
  oil: 'Matches your oil preference',
  learned: 'Learned from your past swaps',
};

function dominantReason(b: ScoreBreakdown): string {
  if (b.learned >= 2) return REASON_LABELS.learned;
  const entries = (['macro', 'kcal', 'cuisine', 'spice', 'oil'] as const).map((k) => [k, b[k]] as const);
  entries.sort((a, b2) => b2[1] - a[1]);
  return REASON_LABELS[entries[0][0]];
}

function pickForSlot(
  candidates: { meal: Meal; breakdown: ScoreBreakdown }[],
  recentIds: string[],
  lastCuisine: string | undefined,
  shuffle: boolean
): { meal: Meal; breakdown: ScoreBreakdown } {
  const fresh = candidates.filter((x) => !recentIds.includes(x.meal.id));
  let pool = fresh.length > 0 ? fresh : candidates;

  if (lastCuisine) {
    pool = [...pool].sort((a, b) => {
      const aPenalty = a.meal.cuisine === lastCuisine ? a.breakdown.total * 0.88 : a.breakdown.total;
      const bPenalty = b.meal.cuisine === lastCuisine ? b.breakdown.total * 0.88 : b.breakdown.total;
      return bPenalty - aPenalty;
    });
  } else {
    pool = [...pool].sort((a, b) => b.breakdown.total - a.breakdown.total);
  }

  if (shuffle) {
    const top = pool.slice(0, Math.min(3, pool.length));
    return top[Math.floor(Math.random() * top.length)];
  }
  return pool[0];
}

function weekMacroSplit(days: PlannedMeal[]): MacroSplit {
  const totalKcal = days.reduce((s, d) => s + d.meal.kcal, 0) || 1;
  const proteinKcal = days.reduce((s, d) => s + d.meal.protein * 4, 0);
  const carbKcal = days.reduce((s, d) => s + d.meal.carbs * 4, 0);
  const fatKcal = days.reduce((s, d) => s + d.meal.fat * 9, 0);
  return { protein: proteinKcal / totalKcal, carb: carbKcal / totalKcal, fat: fatKcal / totalKcal };
}

function buildInsights(planned: MacroSplit, ideal: MacroSplit, avgKcalPerMeal: number, avgProteinPerMeal: number, dailyKcalTarget: number, proteinTargetG: number, mealsPerDay: number, goal: Goal): Insight[] {
  const insights: Insight[] = [];
  const pctPts = (a: number, b: number) => Math.round((a - b) * 100);

  // Absolute protein (grams) vs the personalized target takes priority when a
  // profile is present — it's the number the customer actually cares about.
  if (proteinTargetG > 0) {
    const dailyProtein = avgProteinPerMeal * mealsPerDay;
    const gap = Math.round(((dailyProtein - proteinTargetG) / proteinTargetG) * 100);
    if (gap <= -12) {
      insights.push({ tone: 'watch', text: `Your meals give ~${dailyProtein}g protein/day against your ~${proteinTargetG}g target — add a protein scoop, or lean on chicken/fish/paneer bowls to close it.` });
    } else if (gap >= -5) {
      insights.push({ tone: 'good', text: `Your meals deliver ~${dailyProtein}g protein/day, right on your ~${proteinTargetG}g target.` });
    } else {
      insights.push({ tone: 'tip', text: `Protein is ~${dailyProtein}g/day vs a ~${proteinTargetG}g target — close, a single higher-protein swap would land it.` });
    }
  } else {
    const proteinGap = pctPts(planned.protein, ideal.protein);
    if (proteinGap <= -6) insights.push({ tone: 'watch', text: `Protein is ${Math.abs(proteinGap)} points below your ${goal === 'build' ? 'muscle-building' : 'goal'} target — a protein add-on or an extra chicken/fish day would close it.` });
    else if (proteinGap >= 4) insights.push({ tone: 'good', text: `Protein is running ${proteinGap} points above target — a strong week for satiety and recovery.` });
  }

  const fatGap = pctPts(planned.fat, ideal.fat);
  if (fatGap >= 7) {
    insights.push({ tone: 'watch', text: `Fat share is ${fatGap} points over target — switching a couple of dishes to a lighter oil level would rebalance it.` });
  }

  const dayTarget = dailyKcalTarget;
  const plannedDay = avgKcalPerMeal * mealsPerDay;
  const kcalGap = Math.round(((plannedDay - dayTarget) / dayTarget) * 100);
  if (Math.abs(kcalGap) <= 6) {
    insights.push({ tone: 'good', text: `Your meals land within ${Math.abs(kcalGap)}% of the ~${dayTarget} kcal they should deliver — well matched to your goal.` });
  } else if (kcalGap > 6) {
    insights.push({ tone: 'tip', text: `Your meals run about ${kcalGap}% above their calorie share; a lighter dinner or 2 meals/day would tighten it.` });
  } else {
    insights.push({ tone: 'tip', text: `Your meals run about ${Math.abs(kcalGap)}% below their calorie share; a quinoa base or an add-on would top it up.` });
  }

  return insights.slice(0, 3);
}

function buildSummary(days: PlannedMeal[], input: RecommendInput, dailyKcalTarget: number, proteinTargetG: number): WeeklySummary {
  const goal = input.goal;
  const mealsPerDay = input.mealsPerDay;

  const totalKcal = days.reduce((s, d) => s + d.meal.kcal, 0);
  const totalProtein = days.reduce((s, d) => s + d.meal.protein, 0);
  const cuisineSpread: Record<string, number> = {};
  for (const d of days) cuisineSpread[d.meal.cuisine] = (cuisineSpread[d.meal.cuisine] || 0) + 1;

  let onTargetDays = 0;
  for (let day = 0; day < DAYS; day++) {
    const dayKcal = days.filter((d) => d.day === day).reduce((s, d) => s + d.meal.kcal, 0);
    if (Math.abs(dayKcal - dailyKcalTarget) / dailyKcalTarget <= 0.1) onTargetDays++;
  }

  const avgKcalPerMeal = Math.round(totalKcal / days.length);
  const avgProteinPerMeal = Math.round(totalProtein / days.length);
  const plannedMacro = weekMacroSplit(days);
  const idealMacro = GOAL_TARGETS[goal].macro;

  // --- Plan Fit: a transparent 0-100 grade Sehat gives its own output ---
  const calorie = DAYS ? onTargetDays / DAYS : 0;
  const macroDiff = Math.abs(plannedMacro.protein - idealMacro.protein) + Math.abs(plannedMacro.carb - idealMacro.carb) + Math.abs(plannedMacro.fat - idealMacro.fat);
  const macro = Math.max(0, 1 - macroDiff);
  const variety = Math.min(1, new Set(days.map((d) => d.meal.id)).size / days.length);
  const preference = days.reduce((s, d) => {
    const spiceScore = Math.max(0, 1 - Math.abs(d.meal.spice - input.spice) / 3);
    const oilScore = Math.max(0, 1 - Math.abs(d.meal.oil - input.oil) / 2);
    const cuisineScore = input.cuisine === 'any' || d.meal.cuisine === input.cuisine ? 1 : 0.4;
    return s + (spiceScore + oilScore + cuisineScore) / 3;
  }, 0) / days.length;
  const fitParts: FitParts = { calorie, macro, variety, preference };
  const fitScore = Math.round(100 * (0.3 * calorie + 0.3 * macro + 0.2 * variety + 0.2 * preference));

  return {
    totalKcal,
    totalProtein,
    avgKcalPerMeal,
    avgProteinPerMeal,
    onTargetShare: calorie,
    cuisineSpread,
    plannedMacro,
    idealMacro,
    insights: buildInsights(plannedMacro, idealMacro, avgKcalPerMeal, avgProteinPerMeal, dailyKcalTarget, proteinTargetG, mealsPerDay, goal),
    fitScore,
    fitParts,
    dailyKcalTarget,
    proteinTargetG,
  };
}

// Rebuild the weekly summary (macros, on-target %, insights) from an arbitrary
// set of chosen meals — used after a manual swap so the analytics always match
// exactly what's on screen, not the originally generated week. Pass the same
// targets the week was generated against.
export function summarizeWeek(days: PlannedMeal[], input: RecommendInput, targets?: Targets): WeeklySummary {
  const dailyKcalTarget = targets?.dailyKcal ?? GOAL_TARGETS[input.goal].dailyKcal;
  const proteinTargetG = targets?.proteinG ?? 0;
  return buildSummary(days, input, dailyKcalTarget, proteinTargetG);
}

export function recommendWeek(input: RecommendInput, catalog: Meal[], opts: { shuffle?: boolean; signals?: Signals; targets?: Targets } = {}): RecommendResult {
  const dailyKcalTarget = opts.targets?.dailyKcal ?? GOAL_TARGETS[input.goal].dailyKcal;
  const proteinTargetG = opts.targets?.proteinG ?? 0;
  const targetKcalPerMeal = Math.round(dailyKcalTarget / input.mealsPerDay);
  const targetProteinPerMeal = Math.round((targetKcalPerMeal * GOAL_TARGETS[input.goal].macro.protein) / 4);

  const slots = SLOTS_BY_COUNT[input.mealsPerDay];
  const basePools: Record<string, Meal[]> = {};
  for (const slot of slots) {
    const filtered = catalog.filter((m) => m.slot === slot && dietAllows(m, input.diet) && avoidsAllow(m, input.avoid));
    basePools[slot] = filtered.length > 0 ? filtered : catalog.filter((m) => m.slot === slot && dietAllows(m, input.diet));
  }

  const recentBySlot: Record<string, string[]> = {};
  const lastCuisineBySlot: Record<string, string | undefined> = {};
  for (const slot of slots) recentBySlot[slot] = [];

  const days: PlannedMeal[] = [];
  for (let day = 0; day < DAYS; day++) {
    let runningKcal = 0;
    slots.forEach((slot, slotIndex) => {
      const pool = basePools[slot];
      if (pool.length === 0) return;
      const remainingSlots = slots.length - slotIndex;
      const liveTargetKcal = Math.max(MIN_LIVE_TARGET, Math.round((dailyKcalTarget - runningKcal) / remainingSlots));

      const candidates = pool.map((m) => ({ meal: m, breakdown: scoreMeal(m, liveTargetKcal, input, opts.signals) }));
      const chosen = pickForSlot(candidates, recentBySlot[slot], lastCuisineBySlot[slot], !!opts.shuffle);

      days.push({ day, slot, meal: chosen.meal, score: Math.round(chosen.breakdown.total), reasonTag: dominantReason(chosen.breakdown), liveTargetKcal });
      recentBySlot[slot] = [...recentBySlot[slot], chosen.meal.id].slice(-VARIETY_WINDOW);
      lastCuisineBySlot[slot] = chosen.meal.cuisine;
      runningKcal += chosen.meal.kcal;
    });
  }

  const cuisineNote = input.cuisine === 'any' ? '' : ` with a lean toward ${input.cuisine} Indian flavours`;
  const avoidNote = input.avoid.length ? `, avoiding ${input.avoid.join(', ')}` : '';
  const learnNote = opts.signals && opts.signals.swaps > 0 ? ` Personalised from your ${opts.signals.swaps} past ${opts.signals.swaps === 1 ? 'swap' : 'swaps'}.` : '';
  const targetNote = opts.targets ? `your meals should deliver ~${dailyKcalTarget} kcal/day at ~${proteinTargetG}g protein` : `a ~${dailyKcalTarget} kcal/day target`;
  const reason = `Built for ${GOAL_TARGETS[input.goal].label}: a macro-balanced week where ${targetNote}${cuisineNote}${avoidNote}.${learnNote}`;

  return {
    days,
    targetKcalPerMeal,
    targetProteinPerMeal,
    dailyKcalTarget,
    reason,
    summary: buildSummary(days, input, dailyKcalTarget, proteinTargetG),
  };
}

// Swap: steps to the next distinct dish in the same slot, in a STABLE score
// order. Ordering deliberately ignores the learned signals so repeated swaps
// cycle predictably through the options instead of oscillating as the learning
// nudges re-sort the pool mid-cycle. (Learning still applies to full
// generation.) The signals param is kept for call-site compatibility.
export function nextAlternative(current: Meal, slot: Meal['slot'], input: RecommendInput, catalog: Meal[], _signals?: Signals): Meal {
  const targetKcalPerMeal = Math.round(GOAL_TARGETS[input.goal].dailyKcal / input.mealsPerDay);
  const filtered = catalog.filter((m) => m.slot === slot && dietAllows(m, input.diet) && avoidsAllow(m, input.avoid));
  const pool = (filtered.length > 0 ? filtered : catalog.filter((m) => m.slot === slot && dietAllows(m, input.diet)))
    .map((m) => ({ m, score: scoreMeal(m, targetKcalPerMeal, input).total }))
    .sort((a, b) => b.score - a.score || a.m.id.localeCompare(b.m.id))
    .map((x) => x.m);
  if (pool.length === 0) return current;
  const idx = pool.findIndex((m) => m.id === current.id);
  // Skip forward to the next meal with a DIFFERENT name — composed bowls that
  // vary only by side share a name and photo, so landing on one reads as "swap
  // did nothing." This guarantees every swap is a visibly different dish.
  for (let step = 1; step <= pool.length; step++) {
    const cand = pool[(idx + step) % pool.length];
    if (cand.name !== current.name) return cand;
  }
  return pool[(idx + 1) % pool.length];
}

export const GOAL_LABELS: Record<Goal, string> = {
  lose: 'Lose weight',
  maintain: 'Maintain',
  build: 'Build strength',
};

export const AVOID_LABELS: Record<AvoidTag, string> = {
  paneer: 'Paneer',
  tofu: 'Tofu',
  egg: 'Egg',
  chicken: 'Chicken',
  fish: 'Fish',
  prawn: 'Prawn',
  dal: 'Dal',
};
