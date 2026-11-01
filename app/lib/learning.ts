// Sehat's on-device preference memory.
//
// A static scorer gives the same answer forever. A real recommender learns
// from what the customer actually does. Every time you swap away from a dish
// Sehat proposed, that's a weak negative signal on the dish you rejected and a
// weak positive on the one you chose instead. Sehat folds these learned
// signals back into its score, so the more you use it, the more the week bends
// toward what you keep, away from what you drop.
//
// This is deliberately transparent and bounded: signals are small, capped
// nudges (never enough to override a hard diet/avoid filter or the calorie
// and macro logic), stored on the device as a lightweight personalisation
// cache, and fully resettable. It's the honest, explainable version of "the
// algorithm gets to know you" — no black box, no server-side profiling.

const KEY = 'apna_sehat_signals';

export type Signals = {
  weights: Record<string, number>; // mealId -> learned nudge, clamped to [-MAX, +MAX]
  swaps: number; // how many swaps have taught it, for the "personalised from N swaps" line
};

const MAX_WEIGHT = 8; // points on the 0-100 score scale — a nudge, never a veto
const REJECT_STEP = 2.5;
const ACCEPT_STEP = 2.0;

function read(): Signals {
  if (typeof window === 'undefined') return { weights: {}, swaps: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Signals) : { weights: {}, swaps: 0 };
  } catch {
    return { weights: {}, swaps: 0 };
  }
}

function write(signals: Signals) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(signals));
  } catch {
    /* non-fatal */
  }
}

function clamp(v: number): number {
  return Math.max(-MAX_WEIGHT, Math.min(MAX_WEIGHT, v));
}

export function getSignals(): Signals {
  return read();
}

// Called when the customer swaps a Sehat pick: the rejected dish loses a little
// standing, the accepted dish gains a little.
export function recordSwap(rejectedMealId: string, acceptedMealId: string): Signals {
  const signals = read();
  signals.weights[rejectedMealId] = clamp((signals.weights[rejectedMealId] || 0) - REJECT_STEP);
  signals.weights[acceptedMealId] = clamp((signals.weights[acceptedMealId] || 0) + ACCEPT_STEP);
  signals.swaps += 1;
  write(signals);
  return signals;
}

export function resetSignals(): Signals {
  const empty: Signals = { weights: {}, swaps: 0 };
  write(empty);
  return empty;
}

export function learnedNudge(signals: Signals | undefined, mealId: string): number {
  if (!signals) return 0;
  return signals.weights[mealId] || 0;
}
