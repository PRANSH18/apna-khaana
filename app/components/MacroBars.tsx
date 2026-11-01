import type { MacroSplit } from '@/lib/recommend';

const ROWS: { key: keyof MacroSplit; label: string; color: string }[] = [
  { key: 'protein', label: 'Protein', color: 'bg-leaf' },
  { key: 'carb', label: 'Carbs', color: 'bg-butter' },
  { key: 'fat', label: 'Fat', color: 'bg-chili' },
];

export function MacroBars({ planned, ideal }: { planned: MacroSplit; ideal: MacroSplit }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[.08em] text-ink/45">Macro balance vs your goal</p>
      <div className="mt-4 space-y-4">
        {ROWS.map(({ key, label, color }) => {
          const p = Math.round(planned[key] * 100);
          const target = Math.round(ideal[key] * 100);
          const off = p - target;
          return (
            <div key={key}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">{label}</span>
                <span className="text-ink/50">
                  {p}% <span className="text-ink/35">· target {target}%</span>
                </span>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-wash">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, p)}%` }} />
                {/* target marker */}
                <div className="absolute top-0 h-full w-0.5 bg-ink/40" style={{ left: `${Math.min(100, target)}%` }} title={`Target ${target}%`} />
              </div>
              {Math.abs(off) >= 5 && (
                <p className="mt-1 text-[11px] text-ink/40">{off > 0 ? `${off} pts over target` : `${Math.abs(off)} pts under target`}</p>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] leading-4 text-ink/40">
        The tick on each bar is the ideal for your goal. Sehat scores every dish on how close its own
        split sits to these three targets.
      </p>
    </div>
  );
}
