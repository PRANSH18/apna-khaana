'use client';

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { RecommendInput } from '@/lib/recommend';
import { GOAL_LABELS, AVOID_LABELS } from '@/lib/recommend';

export function AgentExplainer({ input, dailyKcalTarget, swaps = 0 }: {
  input: RecommendInput;
  dailyKcalTarget: number;
  swaps?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-ink/10 bg-wash/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-leaf">
          <Sparkles size={16} /> How Sehat works
        </span>
        <ChevronDown size={18} className={`text-ink/40 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="grid gap-6 border-t border-ink/10 px-6 py-6 text-sm leading-6 text-ink/70 md:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.08em] text-ink/45">Data it uses</p>
            <p>
              Three sources, all visible to you: the catalog&apos;s own numbers (calories, protein,
              carbs, fat, cuisine, spice and oil for all 30 dishes); what you told it (goal, diet,
              cuisine lean, spice, oil, anything to avoid); and your own swap history on this device.
              Nothing biometric, nothing medical, nothing off-device.
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.08em] text-ink/45">How it decides</p>
            <p>
              Your goal ({GOAL_LABELS[input.goal]}) sets a ~{dailyKcalTarget} kcal/day target and an
              ideal protein/carb/fat split. Each dish is scored on macro fit (35), how close it is to
              what&apos;s <em>left</em> of the day&apos;s budget after earlier meals (30, live), cuisine
              (15) and spice/oil (10 each) — then a small, capped nudge (±8) from what you&apos;ve kept
              or dropped before. A dish won&apos;t repeat within 3 days, and repeating yesterday&apos;s
              cuisine is discouraged, both only when the menu allows.
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.08em] text-ink/45">The boundary</p>
            <p>
              A rules-based advisor, not a medical or clinical tool, and it never claims to be. Every
              pick is explainable from the numbers above; the learned nudge is bounded so it can never
              override a diet or avoid filter. Swap any meal, shuffle the week, or reset what it has
              learned — you are always the final editor.
              {swaps > 0 && <> It has adapted to {swaps} of your {swaps === 1 ? 'swap' : 'swaps'} so far.</>}
              {input.avoid.length > 0 && <> Right now it is steering clear of {input.avoid.map((a) => AVOID_LABELS[a]).join(', ')}.</>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
