// Conversational Sehat — a deterministic, rules-based intent agent.
//
// The professor's brief points straight at this: his example was a Q&A agent
// you ask questions and it retrieves and responds. This does exactly that for
// meal planning — no LLM, no API key, no cost. It parses the message for
// intent and answers from real data (the health profile, the computed numbers,
// the current week's analytics), or returns an ACTION that re-plans the week.
// Every answer is traceable to a number on screen; nothing is invented.

import type { HealthProfile, HealthNumbers } from './health';
import { BMI_BAND_LABEL } from './health';
import type { RecommendInput, WeeklySummary, AvoidTag } from './recommend';
import { AVOID_LABELS } from './recommend';

export type AgentContext = {
  profile: HealthProfile | null;
  numbers: HealthNumbers | null;
  summary: WeeklySummary | null;
  input: RecommendInput;
  weekMealCount: number;
  weekTotalPrice: number;
};

export type AgentReply = {
  text: string;
  // When present, the planner applies the patch to Sehat's inputs and regenerates.
  patch?: Partial<RecommendInput>;
};

const has = (m: string, ...words: string[]) => words.some((w) => m.includes(w));

const AVOIDABLES: AvoidTag[] = ['paneer', 'tofu', 'egg', 'chicken', 'fish', 'prawn', 'dal'];

export function askSehat(raw: string, ctx: AgentContext): AgentReply {
  const m = raw.toLowerCase().trim();
  const { profile, numbers, summary, input } = ctx;

  if (!m) return { text: "Ask me anything about your plan — try “how much protein this week?” or “make it higher protein”." };

  // ---- Help ----
  if (has(m, 'help', 'what can you', 'what do you', 'options') || m === 'hi' || m === 'hello' || m === 'hey') {
    return {
      text: [
        'I can answer questions and change your plan. Try:',
        '• "how much protein should I eat?" / "what’s my BMR?"',
        '• "how much protein this week?" / "is this healthy?"',
        '• "am I on track for my goal?"',
        '• "make it higher protein" / "lighter" / "milder" / "less oil"',
        '• "more south indian" / "vegetarian only" / "avoid paneer" / "2 meals a day"',
      ].join('\n'),
    };
  }

  // ---- Actions that re-plan (check these before Q&A so "more protein" acts) ----
  if (has(m, 'more protein', 'higher protein', 'increase protein', 'protein up') || (has(m, 'protein') && has(m, 'more', 'higher', 'boost', 'increase'))) {
    return { text: 'Rebuilding your week to favour protein-dense meals.', patch: { emphasis: 'protein' } };
  }
  if (has(m, 'lighter', 'lower calorie', 'fewer calorie', 'less calorie', 'low cal')) {
    return { text: 'Rebuilding with lighter, lower-calorie meals.', patch: { emphasis: 'lighter' } };
  }
  if (has(m, 'milder', 'less spicy', 'not spicy', 'mild')) {
    return { text: `Turning the spice down to ${Math.max(1, input.spice - 1)}/4 and rebuilding.`, patch: { spice: Math.max(1, input.spice - 1) } };
  }
  if (has(m, 'spicier', 'more spicy', 'hotter')) {
    return { text: `Turning the spice up to ${Math.min(4, input.spice + 1)}/4 and rebuilding.`, patch: { spice: Math.min(4, input.spice + 1) } };
  }
  if (has(m, 'less oil', 'lighter oil', 'low oil', 'oil down')) {
    return { text: `Dropping the oil level to ${Math.max(1, input.oil - 1)}/3 and rebuilding.`, patch: { oil: Math.max(1, input.oil - 1) } };
  }
  if (has(m, 'vegetarian', 'veg only', 'only veg', 'no meat', 'no egg')) {
    return { text: 'Switching to a fully vegetarian week.', patch: { diet: 'veg' } };
  }
  if (has(m, 'everything', 'non veg', 'nonveg', 'non-veg', 'all foods')) {
    return { text: 'Opening the full menu including chicken, fish and prawn.', patch: { diet: 'nonveg' } };
  }
  for (const c of ['south', 'north', 'west'] as const) {
    if (has(m, `more ${c}`, `${c} indian`, `${c}-indian`) || (has(m, c) && has(m, 'cuisine', 'more', 'food'))) {
      return { text: `Leaning the week toward ${c} Indian flavours.`, patch: { cuisine: c } };
    }
  }
  if (has(m, 'any cuisine', 'mix cuisine', 'all cuisine', 'mix it up')) {
    return { text: 'Opening all cuisines again.', patch: { cuisine: 'any' } };
  }
  if (has(m, '2 meal', 'two meal')) return { text: 'Planning 2 meals a day.', patch: { mealsPerDay: 2 } };
  if (has(m, '3 meal', 'three meal')) return { text: 'Planning 3 meals a day.', patch: { mealsPerDay: 3 } };
  for (const tag of AVOIDABLES) {
    if (has(m, `avoid ${tag}`, `no ${tag}`, `without ${tag}`, `skip ${tag}`, `don't want ${tag}`, `remove ${tag}`)) {
      if (!input.avoid.includes(tag)) return { text: `Got it — no ${AVOID_LABELS[tag]} this week.`, patch: { avoid: [...input.avoid, tag] } };
      return { text: `${AVOID_LABELS[tag]} is already off your plan.` };
    }
    if (has(m, `add ${tag}`, `include ${tag}`, `bring back ${tag}`, `${tag} is fine`, `${tag} ok`)) {
      if (input.avoid.includes(tag)) return { text: `${AVOID_LABELS[tag]} is back in.`, patch: { avoid: input.avoid.filter((a) => a !== tag) } };
    }
  }
  if (has(m, 'lose weight', 'cut', 'fat loss', 'slim')) return { text: 'Re-targeting for weight loss.', patch: { goal: 'lose' } };
  if (has(m, 'build', 'muscle', 'bulk', 'gain')) return { text: 'Re-targeting for building strength.', patch: { goal: 'build' } };
  if (has(m, 'maintain', 'stay same')) return { text: 'Re-targeting for maintenance.', patch: { goal: 'maintain' } };

  // ---- Q&A about the person (needs a profile) ----
  if (has(m, 'bmr', 'basal')) {
    return { text: numbers ? `Your BMR is about ${numbers.bmr} kcal/day — what your body burns at complete rest, from the Mifflin-St Jeor equation.` : profilePrompt() };
  }
  if (has(m, 'tdee', 'maintenance', 'maintain calorie', 'burn')) {
    return { text: numbers ? `Your maintenance (TDEE) is about ${numbers.tdee} kcal/day — your BMR times your activity level.` : profilePrompt() };
  }
  if (has(m, 'bmi')) {
    return { text: numbers ? `Your BMI is ${numbers.bmi} (${BMI_BAND_LABEL[numbers.bmiBand].toLowerCase()}). A healthy weight for your height is about ${numbers.healthyWeightRange.min}–${numbers.healthyWeightRange.max} kg.` : profilePrompt() };
  }
  // Note: these "target" questions defer to the "this week" questions below.
  if (!has(m, 'week', 'this plan') && has(m, 'how much protein', 'protein should', 'protein target', 'protein do i need', 'protein per day')) {
    if (numbers) return { text: `Your target is about ${numbers.proteinTargetG}g protein/day for your goal. Your Apna Khaana meals are set to deliver ~${numbers.mealProteinTargetG}g of that; the rest comes from home food and snacks.` };
    return { text: 'Tell me your body details first and I’ll compute your protein target. For a rough guide, aim for 1.5–2.0g per kg of bodyweight.' };
  }
  if (!has(m, 'week', 'this plan') && has(m, 'how many calorie', 'calorie should', 'calorie target', 'calorie do i need', 'how much should i eat')) {
    if (numbers) return { text: `Your goal calories are about ${numbers.goalCalories} kcal/day. Your meals here should deliver ~${numbers.mealCalorieTarget} kcal of that (${Math.round(numbers.mealShare * 100)}% of your day).` };
    return { text: profilePrompt() };
  }

  // ---- On track / timeline ----
  if (has(m, 'on track', 'reach my goal', 'reach goal', 'how long', 'when will i', 'timeline', 'how many weeks')) {
    if (!numbers || !profile) return { text: profilePrompt() };
    if (profile.goal === 'maintain') return { text: 'You’re maintaining — the aim is to hold steady, so there’s no timeline to a target weight.' };
    const dir = numbers.weeklyWeightChangeKg < 0 ? 'lose' : 'gain';
    const rate = Math.abs(numbers.weeklyWeightChangeKg);
    if (numbers.timelineWeeks) {
      return { text: `At your goal calories you’d ${dir} about ${rate.toFixed(2)} kg/week. To reach ${profile.targetWeightKg} kg from ${profile.weightKg} kg, that’s roughly ${numbers.timelineWeeks} weeks. (An estimate — real pace varies.)` };
    }
    return { text: `At your goal calories you’d ${dir} about ${rate.toFixed(2)} kg/week. Set a target weight in your profile and I’ll estimate how many weeks it takes.` };
  }

  // ---- Q&A about the current week ----
  if (has(m, 'protein this week', 'protein am i', 'protein in this', 'weekly protein') || (has(m, 'protein') && has(m, 'week', 'plan', 'getting', 'this'))) {
    if (!summary) return { text: 'Build a week first and I’ll tell you its protein.' };
    return { text: `This week totals ${summary.totalProtein}g protein across ${ctx.weekMealCount} meals — about ${summary.avgProteinPerMeal}g per meal${summary.proteinTargetG ? `, against your ~${summary.proteinTargetG}g/day target` : ''}.` };
  }
  if (has(m, 'calorie this week', 'calories this week', 'calorie per day', 'calories per day') || (has(m, 'calorie', 'kcal') && has(m, 'week', 'plan', 'this'))) {
    if (!summary) return { text: 'Build a week first and I’ll tell you its calories.' };
    return { text: `This week is ${summary.totalKcal.toLocaleString('en-IN')} kcal total, about ${summary.avgKcalPerMeal} kcal per meal${summary.dailyKcalTarget ? ` against a ~${summary.dailyKcalTarget} kcal/day meal target` : ''}.` };
  }
  if (has(m, 'is this healthy', 'how good', 'how healthy', 'fit score', 'plan fit', 'rate this', 'how well')) {
    if (!summary) return { text: 'Build a week first and I’ll grade it.' };
    return { text: `This week scores ${summary.fitScore}/100 on Plan Fit — a blend of calorie match (${Math.round(summary.fitParts.calorie * 100)}%), macro balance (${Math.round(summary.fitParts.macro * 100)}%), variety (${Math.round(summary.fitParts.variety * 100)}%) and how well it matches your preferences (${Math.round(summary.fitParts.preference * 100)}%).` };
  }
  if (has(m, 'why', 'explain', 'reason')) {
    if (!summary) return { text: 'Build a week and I’ll explain each pick — every meal shows the single biggest reason it was chosen.' };
    return { text: `Each dish is scored on macro fit, how close it is to what’s left of the day’s calorie budget, cuisine, and your spice/oil, plus a nudge from your past swaps. The tag under each meal names the top reason it won its slot.` };
  }
  if (has(m, 'cost', 'price', 'how much', 'total')) {
    return { text: `This week is ${ctx.weekMealCount} meals at ₹320 each — ₹${ctx.weekTotalPrice.toLocaleString('en-IN')} total before your subscription tier discount.` };
  }

  return {
    text: "I didn’t catch that. I can talk about your targets (BMR, calories, protein), this week’s nutrition, whether you’re on track, or change the plan (“higher protein”, “milder”, “more south indian”, “avoid paneer”). Type “help” for the full list.",
  };
}

function profilePrompt(): string {
  return 'I need your body details first — add your age, height, weight and activity in the profile step, and I’ll compute this exactly.';
}
