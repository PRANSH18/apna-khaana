// One data layer for the whole authenticated app.
//
// Every /app page used to hand-roll its own "if supabase ... else localStorage"
// logic, and they drifted out of sync — e.g. demo-mode checkout recorded an
// order nowhere, so the Orders tab was always empty after paying. This module
// is the single source of truth: identical async API in both modes, so the
// Plan -> Checkout -> Orders -> Subscription journey stays consistent whether
// or not Supabase keys are present.

import { supabase } from './supabase';
import { currentWeekStart } from './week';
import type { HealthProfile } from './health';

export type PlanItem = { day: number; slot: string; mealId: string; name: string; kcal: number; protein: number; price: number };
export type PlanRecord = { weekStart: string; mealsPerDay: 2 | 3; mode: 'sehat' | 'custom'; items: PlanItem[]; locked: boolean };

export type OrderItem = { day: number; slot: string; mealName: string; kcal: number; protein: number; price: number };
export type OrderRecord = {
  id: string;
  weekStart: string;
  status: 'scheduled' | 'preparing' | 'out_for_delivery' | 'delivered';
  paymentStatus: string;
  tier: Tier;
  total: number;
  address: string;
  createdAt: string;
  items: OrderItem[];
};

export type Tier = 'flex' | 'weekly' | 'monthly';
export type SubscriptionRecord = {
  tier: Tier;
  status: 'active' | 'paused' | 'cancelled';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  price: number;
};

export type ProfileRecord = { name: string; phone: string; address: string };

const K_PLAN = 'apna_demo_plan';
const K_ORDERS = 'apna_demo_orders';
const K_SUB = 'apna_demo_subscription';
const K_PROFILE = 'apna_demo_profile';
// The health profile (age/sex/height/weight/activity/goal) is a lightweight
// client-side cache in both modes — the profiles table has no columns for it
// yet, so this avoids a migration while keeping it fully functional. A future
// migration can move it server-side.
const K_HEALTH = 'apna_health_profile';

const isDemo = !supabase;

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — non-fatal, state simply won't persist */
  }
}

async function requireUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ---------- Plan ----------

export async function savePlan(record: PlanRecord): Promise<{ ok: boolean; error?: string }> {
  if (isDemo) {
    writeLS(K_PLAN, record);
    return { ok: true };
  }
  const user = await requireUser();
  if (!user) return { ok: false, error: 'Please log in to save your plan.' };

  const plan = await supabase!
    .from('plans')
    .upsert({ user_id: user.id, week_start: record.weekStart, status: record.locked ? 'locked' : 'draft' }, { onConflict: 'user_id,week_start' })
    .select('id')
    .single();
  if (plan.error || !plan.data) return { ok: false, error: plan.error?.message || 'Could not save your plan.' };

  await supabase!.from('plan_items').delete().eq('plan_id', plan.data.id);
  const insert = await supabase!.from('plan_items').insert(
    record.items.map((it) => ({ plan_id: plan.data.id, day: it.day, slot: it.slot, meal_id: it.mealId }))
  );
  if (!insert.error) return { ok: true };
  // A foreign-key violation here means the DB's meals catalog is missing dishes
  // this plan references — almost always a database that hasn't been re-seeded
  // after the menu expanded. Surface a specific, actionable message.
  const msg = insert.error.message || '';
  if (/foreign key|violates|meal/i.test(msg)) {
    return { ok: false, error: 'Some meals in this plan are not in your database yet. Re-run supabase/seed.sql, then save again.' };
  }
  return { ok: false, error: `Plan could not be saved: ${msg}` };
}

export async function getPlan(): Promise<PlanRecord | null> {
  const weekStart = currentWeekStart();
  if (isDemo) {
    // Demo keeps whatever was last saved locally, even across a week boundary,
    // so the flow stays demoable without a live clock.
    return readLS<PlanRecord | null>(K_PLAN, null);
  }
  const user = await requireUser();
  if (!user) return null;
  const plan = await supabase!.from('plans').select('id, status').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle();
  if (!plan.data) return null;
  const rows = await supabase!
    .from('plan_items')
    .select('day, slot, meal_id, meals(name, kcal, protein_g, price_inr)')
    .eq('plan_id', plan.data.id);
  const items: PlanItem[] = (rows.data || []).map((r: any) => ({
    day: r.day,
    slot: r.slot,
    mealId: r.meal_id,
    name: r.meals?.name || r.meal_id,
    kcal: r.meals?.kcal || 0,
    protein: r.meals?.protein_g || 0,
    price: r.meals?.price_inr || 320,
  }));
  return { weekStart, mealsPerDay: items.length >= 21 ? 3 : 2, mode: 'sehat', items, locked: plan.data.status === 'locked' };
}

// ---------- Orders ----------

export async function createOrder(input: { tier: Tier; total: number; address: string; items: OrderItem[] }): Promise<{ ok: boolean; error?: string }> {
  const weekStart = currentWeekStart();
  if (isDemo) {
    const order: OrderRecord = {
      id: `sim_${Date.now()}`,
      weekStart,
      status: 'scheduled',
      paymentStatus: 'paid_simulated',
      tier: input.tier,
      total: input.total,
      address: input.address,
      createdAt: new Date().toISOString(),
      items: input.items,
    };
    const orders = readLS<OrderRecord[]>(K_ORDERS, []);
    writeLS(K_ORDERS, [order, ...orders]);

    const plan = readLS<PlanRecord | null>(K_PLAN, null);
    if (plan) writeLS(K_PLAN, { ...plan, locked: true });

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + (input.tier === 'monthly' ? 27 : 6));
    const sub: SubscriptionRecord = {
      tier: input.tier,
      status: 'active',
      currentPeriodStart: weekStart,
      currentPeriodEnd: periodEnd.toISOString().slice(0, 10),
      price: input.total / Math.max(1, input.items.length),
    };
    writeLS(K_SUB, sub);
    return { ok: true };
  }

  const user = await requireUser();
  if (!user) return { ok: false, error: 'Please log in before confirming your week.' };

  const plan = await supabase!.from('plans').select('id').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle();
  const planId = plan.data?.id ?? null;
  const rate = input.total / Math.max(1, input.items.length);

  const order = await supabase!
    .from('orders')
    .insert({
      user_id: user.id,
      plan_id: planId,
      week_start: weekStart,
      status: 'scheduled',
      total_inr: input.total,
      payment_status: 'paid_simulated',
      payment_reference: `sim_${crypto.randomUUID()}`,
      delivery_address: { line1: input.address },
    })
    .select('id')
    .single();
  if (order.error || !order.data) return { ok: false, error: order.error?.message || 'Could not record your order.' };

  if (input.items.length > 0) {
    await supabase!.from('order_items').insert(
      input.items.map((it) => ({
        order_id: order.data.id,
        day: it.day,
        slot: it.slot,
        meal_id: undefined,
        meal_name: it.mealName,
        kcal: it.kcal,
        protein_g: it.protein,
        price_inr: it.price,
      }))
    );
  }
  if (planId) await supabase!.from('plans').update({ status: 'locked', locked_at: new Date().toISOString() }).eq('id', planId);

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + (input.tier === 'monthly' ? 27 : 6));
  const subFields = {
    tier: input.tier,
    status: 'active' as const,
    current_period_start: weekStart,
    current_period_end: periodEnd.toISOString().slice(0, 10),
    price_inr: Math.round(rate),
  };
  const existingSub = await supabase!.from('subscriptions').select('id').eq('user_id', user.id).maybeSingle();
  if (existingSub.data) await supabase!.from('subscriptions').update(subFields).eq('id', existingSub.data.id);
  else await supabase!.from('subscriptions').insert({ user_id: user.id, ...subFields });

  return { ok: true };
}

export async function getOrders(): Promise<OrderRecord[]> {
  if (isDemo) return readLS<OrderRecord[]>(K_ORDERS, []);
  const user = await requireUser();
  if (!user) return [];
  const result = await supabase!
    .from('orders')
    .select('id, week_start, status, total_inr, payment_status, created_at, order_items(day, slot, meal_name, kcal, protein_g, price_inr)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return (result.data || []).map((o: any) => ({
    id: o.id,
    weekStart: o.week_start,
    status: o.status,
    paymentStatus: o.payment_status,
    tier: 'weekly',
    total: o.total_inr,
    address: '',
    createdAt: o.created_at,
    items: (o.order_items || []).map((it: any) => ({ day: it.day, slot: it.slot, mealName: it.meal_name, kcal: it.kcal || 0, protein: it.protein_g || 0, price: it.price_inr || 0 })),
  }));
}

// ---------- Subscription ----------

export async function getSubscription(): Promise<SubscriptionRecord | null> {
  if (isDemo) return readLS<SubscriptionRecord | null>(K_SUB, null);
  const user = await requireUser();
  if (!user) return null;
  const result = await supabase!
    .from('subscriptions')
    .select('tier, status, current_period_start, current_period_end, price_inr')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!result.data) return null;
  return {
    tier: result.data.tier,
    status: result.data.status,
    currentPeriodStart: result.data.current_period_start,
    currentPeriodEnd: result.data.current_period_end,
    price: result.data.price_inr,
  };
}

export async function updateSubscriptionStatus(status: SubscriptionRecord['status']): Promise<SubscriptionRecord | null> {
  if (isDemo) {
    const sub = readLS<SubscriptionRecord | null>(K_SUB, null);
    if (!sub) return null;
    const next = { ...sub, status };
    writeLS(K_SUB, next);
    return next;
  }
  const user = await requireUser();
  if (!user) return null;
  const existing = await supabase!.from('subscriptions').select('id').eq('user_id', user.id).maybeSingle();
  if (!existing.data) return null;
  const result = await supabase!
    .from('subscriptions')
    .update({ status })
    .eq('id', existing.data.id)
    .select('tier, status, current_period_start, current_period_end, price_inr')
    .single();
  if (result.error || !result.data) return null;
  return {
    tier: result.data.tier,
    status: result.data.status,
    currentPeriodStart: result.data.current_period_start,
    currentPeriodEnd: result.data.current_period_end,
    price: result.data.price_inr,
  };
}

// ---------- Profile ----------

export async function getProfile(): Promise<ProfileRecord> {
  if (isDemo) return readLS<ProfileRecord>(K_PROFILE, { name: '', phone: '', address: '' });
  const user = await requireUser();
  if (!user) return { name: '', phone: '', address: '' };
  const [profile, addr] = await Promise.all([
    supabase!.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
    supabase!.from('addresses').select('line1').eq('user_id', user.id).eq('is_default', true).maybeSingle(),
  ]);
  return { name: profile.data?.full_name || '', phone: profile.data?.phone || '', address: addr.data?.line1 || '' };
}

export async function saveProfile(record: ProfileRecord): Promise<void> {
  if (isDemo) {
    writeLS(K_PROFILE, record);
    return;
  }
  const user = await requireUser();
  if (!user) return;
  await supabase!.from('profiles').upsert({ id: user.id, full_name: record.name, phone: record.phone });
  if (record.address.trim()) {
    const existing = await supabase!.from('addresses').select('id').eq('user_id', user.id).eq('is_default', true).maybeSingle();
    if (existing.data) await supabase!.from('addresses').update({ line1: record.address }).eq('id', existing.data.id);
    else await supabase!.from('addresses').insert({ user_id: user.id, label: 'Default', line1: record.address, is_default: true });
  }
}

// ---- Health profile (client-side cache in both modes) ----

export function getHealthProfile(): HealthProfile | null {
  return readLS<HealthProfile | null>(K_HEALTH, null);
}

export function saveHealthProfile(profile: HealthProfile): void {
  writeLS(K_HEALTH, profile);
}

export async function signOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    [K_PLAN, K_ORDERS, K_SUB, K_PROFILE, K_HEALTH, 'apna_sehat_signals', 'apna_user', 'apna_plan', 'apna_account'].forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    });
  }
}

export { isDemo };
