// Shared week/lock-time helpers so the Monday-start calculation and the
// Sunday-lock countdown live in exactly one place, not copy-pasted per page.

export function currentWeekStart(): string {
  const start = new Date();
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return start.toISOString().slice(0, 10);
}

export function formatWeekRange(weekStartISO: string): string {
  const start = new Date(`${weekStartISO}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function sundayLockCountdown(now: Date = new Date()): { label: string; hoursLeft: number } {
  const day = now.getDay(); // 0 = Sunday
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  const lockAt = new Date(now);
  lockAt.setDate(now.getDate() + daysUntilSunday);
  lockAt.setHours(23, 59, 59, 999);
  if (lockAt.getTime() < now.getTime()) lockAt.setDate(lockAt.getDate() + 7);

  const diffMs = lockAt.getTime() - now.getTime();
  const hoursLeft = Math.max(0, Math.floor(diffMs / 3600000));
  const days = Math.floor(hoursLeft / 24);
  const hrs = hoursLeft % 24;
  const label = days > 0 ? `Locks in ${days}d ${hrs}h` : `Locks in ${hrs}h`;
  return { label, hoursLeft };
}

export function timeOfDayGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
