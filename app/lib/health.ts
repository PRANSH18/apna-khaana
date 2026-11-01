// The science layer — how Sehat turns a person into targets.
//
// Every number here comes from a published, widely-used formula, and the whole
// module is framed as an ESTIMATE, not medical advice. This is what makes the
// agent's calorie and protein targets defensible: they are derived from the
// customer's own body and activity, not picked from a lookup table.
//
//  - BMI: weight / height^2 (WHO bands).
//  - BMR: Mifflin-St Jeor equation (the modern standard used by HealthifyMe,
//    MyFitnessPal and clinical calculators).
//  - TDEE: BMR x an activity multiplier.
//  - Goal calories: a deficit / maintenance / surplus off TDEE.
//  - Protein: grams per kg of bodyweight, from mainstream sports-nutrition
//    guidance (higher in a deficit to spare muscle, higher again to build).
//  - Meal share: Apna Khaana delivers meals, not a whole diet, so the targets
//    the meals must hit are a share of the daily target — the rest is the
//    customer's own home food, snacks and drinks. This keeps the promise honest.

export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type HealthGoal = 'lose' | 'maintain' | 'build';

export type HealthProfile = {
  age: number;
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activity: Activity;
  goal: HealthGoal;
  targetWeightKg?: number;
};

export type HealthNumbers = {
  bmi: number;
  bmiBand: 'underweight' | 'healthy' | 'overweight' | 'obese';
  healthyWeightRange: { min: number; max: number }; // kg for this height
  bmr: number; // kcal/day at rest
  tdee: number; // kcal/day maintenance
  goalCalories: number; // kcal/day for the goal
  proteinTargetG: number; // g/day for the goal
  mealShare: number; // fraction of the day the meals cover
  mealCalorieTarget: number; // kcal/day the Apna Khaana meals should deliver
  mealProteinTargetG: number; // g/day protein from the meals
  timelineWeeks: number | null; // weeks to targetWeight, null if maintain / no target
  weeklyWeightChangeKg: number; // + gain / - loss per week at the goal calories
};

export const ACTIVITY_FACTORS: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

export const ACTIVITY_LABELS: Record<Activity, string> = {
  sedentary: 'Mostly sitting',
  light: 'Light (1-3 days/wk)',
  moderate: 'Moderate (3-5 days/wk)',
  active: 'Active (6-7 days/wk)',
  very_active: 'Very active / athlete',
};

const PROTEIN_PER_KG: Record<HealthGoal, number> = { lose: 2.0, maintain: 1.5, build: 1.8 };
const CALORIE_FLOOR = 1200; // never recommend below this from a deficit
const KCAL_PER_KG = 7700; // approx energy in 1 kg of body mass

// Apna Khaana serves portion-controlled meals (~430 kcal each). Even hearty
// bowls top out around 600, so the realistic calories the meals can deliver in
// a day is capped — the SHARE of the day they cover then falls out of the
// person's goal (a bulking day of 2700 kcal gets a smaller share from a meal
// service than a 1500 kcal cutting day). This keeps the target achievable and
// the "meals cover X% of your day" promise honest.
const MEAL_CAP_PER_DAY: Record<2 | 3, number> = { 3: 1380, 2: 960 };
const MEAL_DESIRED_SHARE = 0.85; // meals aim to cover up to this much of the day, before the cap

export function computeHealth(profile: HealthProfile, mealsPerDay: 2 | 3): HealthNumbers {
  const { age, sex, heightCm, weightKg, activity, goal, targetWeightKg } = profile;
  const heightM = heightCm / 100;

  const bmi = weightKg / (heightM * heightM);
  const bmiBand = bmi < 18.5 ? 'underweight' : bmi < 25 ? 'healthy' : bmi < 30 ? 'overweight' : 'obese';
  const healthyWeightRange = { min: Math.round(18.5 * heightM * heightM), max: Math.round(24.9 * heightM * heightM) };

  const bmrRaw = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
  const bmr = Math.round(bmrRaw);
  const tdee = Math.round(bmr * ACTIVITY_FACTORS[activity]);

  let goalCalories: number;
  if (goal === 'lose') goalCalories = Math.max(bmr, tdee - 500, CALORIE_FLOOR);
  else if (goal === 'build') goalCalories = tdee + 350;
  else goalCalories = tdee;
  goalCalories = Math.round(goalCalories);

  const proteinTargetG = Math.round(weightKg * PROTEIN_PER_KG[goal]);

  const mealCalorieTarget = Math.round(Math.min(goalCalories * MEAL_DESIRED_SHARE, MEAL_CAP_PER_DAY[mealsPerDay]));
  const mealShare = mealCalorieTarget / goalCalories;
  const mealProteinTargetG = Math.round(proteinTargetG * mealShare);

  // + surplus builds, - deficit loses; convert daily kcal gap to weekly kg.
  const dailyGap = goalCalories - tdee; // negative for lose, positive for build
  const weeklyWeightChangeKg = (dailyGap * 7) / KCAL_PER_KG;

  let timelineWeeks: number | null = null;
  if (goal !== 'maintain' && targetWeightKg && Math.abs(weeklyWeightChangeKg) > 0.01) {
    const delta = targetWeightKg - weightKg; // negative if losing
    // Only produce a timeline when the direction matches the goal.
    if (Math.sign(delta) === Math.sign(weeklyWeightChangeKg)) {
      timelineWeeks = Math.max(1, Math.round(Math.abs(delta) / Math.abs(weeklyWeightChangeKg)));
    }
  }

  return {
    bmi: Math.round(bmi * 10) / 10,
    bmiBand,
    healthyWeightRange,
    bmr,
    tdee,
    goalCalories,
    proteinTargetG,
    mealShare,
    mealCalorieTarget,
    mealProteinTargetG,
    timelineWeeks,
    weeklyWeightChangeKg: Math.round(weeklyWeightChangeKg * 100) / 100,
  };
}

export const BMI_BAND_LABEL: Record<HealthNumbers['bmiBand'], string> = {
  underweight: 'Underweight',
  healthy: 'Healthy weight',
  overweight: 'Overweight',
  obese: 'Obese',
};
