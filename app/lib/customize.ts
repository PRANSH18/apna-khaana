// The self-customize builder — no AI involved by design.
//
// This is the manual counterpart to Sehat (lib/recommend.ts): five explicit
// levers, each a fixed, published delta on top of a chosen catalog dish.
// Nothing here is scored or ranked — the customer sets every value directly,
// and the result is arithmetic, not a recommendation.
//
// Protein source and meal base are multi-select: a customer can pick more
// than one of each (e.g. paneer + chicken, rice + quinoa), and the week
// rotates independently through both lists so the week doesn't repeat the
// same combination every day even though nothing is "recommended."

import { meals, type Meal, type MealDiet } from './meals';
import { dietAllows, type DietPref } from './recommend';

export type ProteinSource = 'paneer' | 'tofu' | 'dal' | 'egg' | 'chicken';
export type MealBase = 'rice' | 'quinoa' | 'millet-roti' | 'multigrain-roti';
export type AddOn = 'extra-protein' | 'seeds' | 'extra-greens' | 'low-carb';

// Multi-select state as configured in the planner UI.
export type CustomizeSelection = {
  diet: DietPref;
  spice: number; // 1-4, flavour only — no macro effect
  oil: number; // 1-3
  proteins: ProteinSource[]; // at least one
  bases: MealBase[]; // at least one
  addOns: AddOn[];
};

// A single day's resolved choice (one protein, one base) after rotation.
export type CustomizeDay = {
  diet: DietPref;
  spice: number;
  oil: number;
  protein: ProteinSource;
  base: MealBase;
  addOns: AddOn[];
};

export type CustomizedMeal = {
  meal: Meal;
  kcal: number;
  protein: number;
  price: number;
  tags: string[];
};

type Delta = { protein: number; kcal: number; price: number; label: string };

export const PROTEIN_OPTIONS: Record<ProteinSource, Delta & { requires: MealDiet | 'any' }> = {
  dal: { protein: -4, kcal: -30, price: -20, label: 'Dal & legumes', requires: 'any' },
  paneer: { protein: 0, kcal: 0, price: 0, label: 'Paneer', requires: 'any' },
  tofu: { protein: -2, kcal: -40, price: 0, label: 'Tofu', requires: 'any' },
  egg: { protein: 4, kcal: 10, price: 0, label: 'Egg', requires: 'egg' },
  chicken: { protein: 8, kcal: 20, price: 20, label: 'Chicken', requires: 'nonveg' },
};

export const MEAL_BASE_OPTIONS: Record<MealBase, Delta> = {
  rice: { protein: 0, kcal: 0, price: 0, label: 'Steamed rice' },
  quinoa: { protein: 2, kcal: 10, price: 30, label: 'Quinoa' },
  'millet-roti': { protein: 1, kcal: -20, price: 0, label: 'Millet roti' },
  'multigrain-roti': { protein: 1, kcal: -10, price: 0, label: 'Multigrain roti' },
};

export const ADD_ON_OPTIONS: Record<AddOn, Delta> = {
  'extra-protein': { protein: 8, kcal: 60, price: 40, label: 'Extra protein scoop' },
  seeds: { protein: 3, kcal: 70, price: 20, label: 'Seeds & nuts' },
  'extra-greens': { protein: 1, kcal: 15, price: 15, label: 'Extra greens' },
  'low-carb': { protein: 0, kcal: -50, price: 0, label: 'Low-carb swap' },
};

const OIL_LABELS = ['', 'Light oil', 'Standard oil', 'Regular oil'];
const SPICE_LABELS = ['', 'Mild', 'Medium', 'Spicy', 'Extra spicy'];
const OIL_KCAL_PER_LEVEL = 35;

// Protein sources a diet preference allows: veg -> dal/paneer/tofu, egg -> + egg, nonveg -> + chicken.
export function allowedProteins(diet: DietPref): ProteinSource[] {
  const order: ProteinSource[] = ['dal', 'paneer', 'tofu', 'egg', 'chicken'];
  return order.filter((p) => {
    const req = PROTEIN_OPTIONS[p].requires;
    if (req === 'any') return true;
    if (req === 'egg') return diet === 'egg' || diet === 'nonveg';
    if (req === 'nonveg') return diet === 'nonveg';
    return true;
  });
}

// ---- Component-driven custom meals ----
//
// The self-build path composes REAL bowls from the catalog that match the
// chosen protein and base — so a "Chicken + Quinoa" selection shows an actual
// "Grilled Chicken Quinoa Bowl", not an unrelated named dish with mismatched
// tags. Breakfast has no composed bowls, so it draws from signature breakfasts.
// The composed bowl ids are shaped `bowl-<slot>-<base>-<protein>-<side>`.

const PROTEIN_TO_BOWL: Record<ProteinSource, string[]> = {
  paneer: ['paneer'],
  tofu: ['tofu'],
  dal: ['rajma', 'chana'],
  egg: ['egg'],
  chicken: ['chicken'],
};
const BASE_TO_BOWL: Record<MealBase, string[]> = {
  rice: ['white-rice', 'brown-rice'],
  quinoa: ['quinoa'],
  'millet-roti': ['millet'],
  'multigrain-roti': ['roti'],
};

// The pool of catalog meals a given slot should draw from for this selection.
export function customMealsForSlot(selection: CustomizeSelection, slot: Meal['slot']): Meal[] {
  if (slot === 'Breakfast') {
    return meals.filter((m) => m.slot === 'Breakfast' && dietAllows(m, selection.diet) && !m.id.startsWith('bowl-'));
  }
  const proteinKeys = selection.proteins.flatMap((p) => PROTEIN_TO_BOWL[p]);
  const baseKeys = selection.bases.flatMap((b) => BASE_TO_BOWL[b]);
  const bowls = meals.filter(
    (m) =>
      m.slot === slot &&
      m.id.startsWith(`bowl-${slot.toLowerCase()}-`) &&
      dietAllows(m, selection.diet) &&
      baseKeys.some((b) => m.id.includes(`-${b}-`)) &&
      proteinKeys.some((p) => m.id.includes(`-${p}-`))
  );
  // Composed bowls that differ only by side share a name, which makes a swap
  // look like nothing changed. Dedupe to one bowl per distinct name (i.e. per
  // protein x base combo) so cycling through them is always visibly different.
  const seen = new Set<string>();
  const unique = bowls.filter((m) => (seen.has(m.name) ? false : (seen.add(m.name), true)));
  // Fallback (e.g. an all-veg selection with no matching bowl): diet-matching signatures.
  return unique.length ? unique : meals.filter((m) => m.slot === slot && dietAllows(m, selection.diet) && !m.id.startsWith('bowl-'));
}

// Applies only the finishing levers (oil level, add-ons) on top of a composed
// bowl — the protein and base are already baked into the bowl itself.
export function applyFinish(meal: Meal, selection: CustomizeSelection): CustomizedMeal {
  const oilDelta = (selection.oil - meal.oil) * OIL_KCAL_PER_LEVEL;
  const addOnDeltas = selection.addOns.map((a) => ADD_ON_OPTIONS[a]);
  const addOnKcal = addOnDeltas.reduce((s, d) => s + d.kcal, 0);
  const addOnProtein = addOnDeltas.reduce((s, d) => s + d.protein, 0);
  const addOnPrice = addOnDeltas.reduce((s, d) => s + d.price, 0);

  const kcal = Math.max(120, meal.kcal + oilDelta + addOnKcal);
  const proteinG = Math.max(4, meal.protein + addOnProtein);
  const price = Math.max(200, meal.price + addOnPrice);

  const tags = [OIL_LABELS[selection.oil], SPICE_LABELS[selection.spice], ...addOnDeltas.map((d) => d.label)].filter(Boolean);
  return { meal, kcal: Math.round(kcal), protein: Math.round(proteinG), price: Math.round(price), tags };
}

// Resolves which protein/base a given day (0-6) uses, cycling independently
// through both selected lists so a 2-protein x 3-base selection produces up
// to 6 distinct combinations across the week before repeating.
export function resolveDay(selection: CustomizeSelection, day: number): CustomizeDay {
  const proteins: ProteinSource[] = selection.proteins.length ? selection.proteins : ['paneer'];
  const bases: MealBase[] = selection.bases.length ? selection.bases : ['rice'];
  return {
    diet: selection.diet,
    spice: selection.spice,
    oil: selection.oil,
    protein: proteins[day % proteins.length],
    base: bases[day % bases.length],
    addOns: selection.addOns,
  };
}

export function applyCustomization(meal: Meal, custom: CustomizeDay): CustomizedMeal {
  const protein = PROTEIN_OPTIONS[custom.protein];
  const base = MEAL_BASE_OPTIONS[custom.base];
  const oilDelta = (custom.oil - meal.oil) * OIL_KCAL_PER_LEVEL;

  const addOnDeltas = custom.addOns.map((a) => ADD_ON_OPTIONS[a]);
  const addOnKcal = addOnDeltas.reduce((s, d) => s + d.kcal, 0);
  const addOnProtein = addOnDeltas.reduce((s, d) => s + d.protein, 0);
  const addOnPrice = addOnDeltas.reduce((s, d) => s + d.price, 0);

  const kcal = Math.max(120, meal.kcal + protein.kcal + base.kcal + oilDelta + addOnKcal);
  const proteinG = Math.max(4, meal.protein + protein.protein + base.protein + addOnProtein);
  const price = Math.max(200, meal.price + protein.price + base.price + addOnPrice);

  const tags = [
    protein.label,
    base.label,
    OIL_LABELS[custom.oil],
    SPICE_LABELS[custom.spice],
    ...addOnDeltas.map((d) => d.label),
  ];

  return { meal, kcal: Math.round(kcal), protein: Math.round(proteinG), price: Math.round(price), tags };
}
