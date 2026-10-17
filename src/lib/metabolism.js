// Client-side maintenance estimation. No AI calls — pure math.

import { differenceInDays, parseISO, addWeeks, format } from "date-fns";

const LIFESTYLE = {
  sedentary: 1.2,
  light: 1.3,
  moderate: 1.4,
  active: 1.45,
  very_active: 1.5,
};

export function trainingDaysFromCadence(cadence) {
  if (cadence === "4-6") return 5;
  return 4; // "3-5" or default
}

export function mifflinBMR(sex, kg, cm, age) {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return sex === "female" ? base - 161 : base + 5;
}

export function activityMultiplier(activityLevel, trainingDays) {
  const base = LIFESTYLE[activityLevel] ?? 1.2;
  return Math.min(1.75, base + 0.025 * trainingDays);
}

export function metabolismAdjustment(struggle, pastYear) {
  const s = struggle === "lose_w" ? -0.05 : struggle === "gain_w" ? 0.05 : 0;
  const p = pastYear === "gained" ? -0.03 : pastYear === "lost" ? 0.02 : 0;
  let pct = s + p;
  pct = Math.max(-0.08, Math.min(0.08, pct));
  const name =
    pct < 0 ? "Slower-burning profile" : pct > 0 ? "Fast-burning profile" : "Balanced profile";
  return { pct, name };
}

export function computeBaseline(profile) {
  const bmr = mifflinBMR(profile.sex, profile.current_weight, profile.height, profile.age);
  const trainingDays = trainingDaysFromCadence(profile.cadence);
  const multiplier = activityMultiplier(profile.activity_level, trainingDays);
  const scienceMaintenance = Math.round(bmr * multiplier);
  const { pct, name } = metabolismAdjustment(
    profile.calibration_answers?.struggle,
    profile.calibration_answers?.past_year
  );
  const baseline = Math.round(scienceMaintenance * (1 + pct));

  let goalWeightKg = profile.current_weight;
  if (profile.goal === "lose") goalWeightKg = profile.current_weight - (profile.goal_amount || 0);
  if (profile.goal === "gain") goalWeightKg = profile.current_weight + (profile.goal_amount || 0);
  const goalWeightLb = goalWeightKg * 2.20462;
  const currentWeightLb = profile.current_weight * 2.20462;
  let perLb;
  if (profile.goal === "lose") perLb = currentWeightLb <= 200 ? 1.0 : 0.7;
  else if (profile.goal === "gain" && name === "Fast-burning profile") perLb = 1.2;
  else perLb = 1.0;
  const protein = Math.round((currentWeightLb * perLb) / 5) * 5;

  return {
    bmr: Math.round(bmr),
    multiplier,
    trainingDays,
    scienceMaintenance,
    adjPct: pct,
    adjName: name,
    baseline,
    protein,
    goalWeightKg,
    goalWeightLb,
    goalType: profile.goal,
    goalAmount: profile.goal_amount || 0,
  };
}

// Daily protein target: the member's manual override if set, otherwise the
// live formula from current weight + goal (never the metabolism_profile
// snapshot) so the target follows weight changes and refreshes for everyone.
export function dailyProteinTarget(profile) {
  if (profile && Number.isFinite(profile.protein_override_g)) return profile.protein_override_g;
  return computeBaseline(profile).protein;
}

export function parseTimeframe(t) {
  if (t === "1 month") return 4;
  if (t === "2 months") return 8;
  if (t === "3 months") return 12;
  if (t === "6+ months") return 26;
  return 12;
}

export function computePace(baseline, goalType, goalAmountKg, weeks, sex) {
  if (goalType === "maintain") {
    return { maintain: true, targetIntake: baseline, dailyDelta: 0, weeklyPaceLb: 0, warn: false, warnMessage: "" };
  }
  const goalAmountLb = (goalAmountKg || 0) * 2.20462;
  const totalCalChange = goalAmountLb * 3500;
  const days = Math.max(1, weeks * 7);
  const implied = totalCalChange / days;
  const isDeficit = goalType === "lose";
  const floor = sex === "female" ? 1200 : 1500;
  const hardMax = isDeficit ? 1000 : 500;
  const delta = Math.min(implied, hardMax);
  let targetIntake = Math.round(isDeficit ? baseline - delta : baseline + delta);
  let warn = false;
  let warnMessage = "";
  const belowFloor = isDeficit && targetIntake < floor;
  if (belowFloor) targetIntake = floor;
  if (implied > hardMax || belowFloor) {
    warn = true;
    const parts = [];
    if (implied > hardMax)
      parts.push(`that pace needs ~${Math.round(implied)} cal/day, beyond the safe ${hardMax} max`);
    if (belowFloor) parts.push(`target is capped at the ${floor} cal/day floor`);
    warnMessage = `Kind note — ${parts.join(" and ")}. A gentler pace is recommended.`;
  }
  const weeklyPaceLb = goalAmountLb / Math.max(0.0001, weeks);
  return {
    maintain: false,
    isDeficit,
    dailyDelta: Math.round(delta),
    weeklyPaceLb: +weeklyPaceLb.toFixed(2),
    targetIntake,
    warn,
    warnMessage,
  };
}

const LBS_PER_KG = 2.20462;

export function goalPacing(maintenance, goalType, goalAmountKg, weeks, sex) {
  const goalAmountLb = (goalAmountKg || 0) * LBS_PER_KG;
  const isLoss = goalType === "lose";
  const isGain = goalType === "gain";
  const floor = sex === "female" ? 1200 : 1500;
  const recommendedMin = 300;
  const recommendedMax = 500;
  const largeAmount = goalAmountLb >= 15;
  const hardMax = isLoss ? (largeAmount ? 1000 : 500) : 500;

  const totalCalChange = goalAmountLb * 3500;
  const days = Math.max(1, weeks * 7);
  const impliedDelta = totalCalChange / days;
  const impliedTarget = isLoss ? maintenance - impliedDelta : maintenance + impliedDelta;

  const recommendedDeltaRaw = Math.min(recommendedMax, Math.max(recommendedMin, impliedDelta));
  let recommendedTarget = isLoss ? maintenance - recommendedDeltaRaw : maintenance + recommendedDeltaRaw;
  let floorClamped = false;
  if (isLoss && recommendedTarget < floor) {
    recommendedTarget = floor;
    floorClamped = true;
  }
  const recommendedDeltaEffective = isLoss
    ? maintenance - recommendedTarget
    : recommendedTarget - maintenance;
  const recWeeklyPaceLb = (recommendedDeltaEffective * 7) / 3500;
  const realisticWeeks = recWeeklyPaceLb > 0 ? goalAmountLb / recWeeklyPaceLb : 0;
  const realisticDate = format(addWeeks(new Date(), Math.round(realisticWeeks)), "MMM d, yyyy");

  const impliedTooAggressive = isLoss
    ? impliedDelta > recommendedMax || impliedTarget < floor
    : impliedDelta > recommendedMax;
  const impliedTooSlow = impliedDelta < recommendedMin;

  return {
    goalType,
    goalAmountLb,
    isLoss,
    isGain,
    floor,
    recommendedMin,
    recommendedMax,
    hardMax,
    largeAmount,
    impliedDelta: Math.round(impliedDelta),
    impliedTarget: Math.round(impliedTarget),
    impliedTooAggressive,
    impliedTooSlow,
    recommendedDelta: Math.round(recommendedDeltaEffective),
    recommendedTarget: Math.round(recommendedTarget),
    floorClamped,
    realisticWeeks: +realisticWeeks.toFixed(1),
    realisticDate,
    sliderMin: recommendedMin,
    sliderMax: hardMax,
  };
}

export function paceAtDelta(maintenance, goalType, goalAmountKg, delta, sex) {
  const goalAmountLb = (goalAmountKg || 0) * LBS_PER_KG;
  const isLoss = goalType === "lose";
  const floor = sex === "female" ? 1200 : 1500;
  let target = isLoss ? maintenance - delta : maintenance + delta;
  let floorClamped = false;
  if (isLoss && target < floor) {
    target = floor;
    floorClamped = true;
  }
  const effectiveDelta = isLoss ? maintenance - target : target - maintenance;
  const weeklyPaceLb = (effectiveDelta * 7) / 3500;
  const weeks = weeklyPaceLb > 0 ? goalAmountLb / weeklyPaceLb : 0;
  const date = format(addWeeks(new Date(), Math.round(weeks)), "MMM d, yyyy");
  return {
    target: Math.round(target),
    effectiveDelta: Math.round(effectiveDelta),
    weeks: +weeks.toFixed(1),
    date,
    floorClamped,
    aggressive: delta > 500,
  };
}

export function labelForWeeks(weeks) {
  if (weeks <= 5) return "1 month";
  if (weeks <= 9) return "2 months";
  if (weeks <= 17) return "3 months";
  return "6+ months";
}

export function refinementEligibility(logs, weighIns) {
  const entries = (logs || []).filter((l) => typeof l.calories === "number" && l.calories > 0);
  const wIns = (weighIns || []).filter((w) => w.date && typeof w.weight === "number");
  const missing = [];
  if (entries.length < 7) missing.push({ need: "entries", have: entries.length, want: 7 });
  if (wIns.length < 2) missing.push({ need: "weighins", have: wIns.length, want: 2 });
  return { eligible: missing.length === 0, missing, entries, wIns };
}

export function computeRefinement(logs, weighIns) {
  const { eligible, missing, entries, wIns } = refinementEligibility(logs, weighIns);
  if (!eligible) return { eligible: false, missing };
  const wSorted = [...wIns].sort((a, b) => a.date.localeCompare(b.date));
  const first = wSorted[0];
  const last = wSorted[wSorted.length - 1];
  const daysBetween = Math.max(1, differenceInDays(parseISO(last.date), parseISO(first.date)));
  const period = entries.filter((l) => l.date >= first.date && l.date <= last.date);
  const used = period.length >= 3 ? period : entries;
  const avgCalories = used.length ? used.reduce((s, l) => s + l.calories, 0) / used.length : 0;
  const weeklyChangeKg = ((last.weight - first.weight) * 7) / daysBetween;
  const weeklyChangeLbs = +(weeklyChangeKg * 2.20462).toFixed(2);
  const trueMaintenance = Math.round(avgCalories - (weeklyChangeLbs * 3500) / 7);
  return {
    eligible: true,
    avgCalories: Math.round(avgCalories),
    weeklyChangeLbs,
    trueMaintenance,
    daysCovered: daysBetween,
    entryCount: used.length,
    firstWeight: first.weight,
    lastWeight: last.weight,
    firstDate: first.date,
    lastDate: last.date,
  };
}

export function computeManualRefinement(avgCalories, weeklyChangeLbs) {
  return Math.round(Number(avgCalories) - (Number(weeklyChangeLbs) * 3500) / 7);
}

export function currentMaintenance(profile, history) {
  const sorted = [...(history || [])].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (sorted.length === 0) {
    return { value: computeBaseline(profile).baseline, source: "estimated", confidence: "Estimated", refinements: 0 };
  }
  const latest = sorted[0];
  const refinements = sorted.length;
  const confidence = refinements >= 3 ? "Dialed In" : refinements >= 1 ? "Refined" : "Estimated";
  return { value: latest.value, source: latest.source, confidence, refinements, date: latest.date };
}

// Target-bodyweight goal helpers. The onboarding + Settings goal flow asks for
// a TARGET bodyweight (lbs); we derive the goal direction + delta (kg) from it
// so every downstream consumer (maintenance, target, goal line, winning week)
// keeps reading the same `goal` + `goal_amount` fields unchanged.

export function targetWeightKg(profile) {
  const cur = profile?.current_weight;
  if (cur == null) return null;
  const amt = profile?.goal_amount || 0;
  if (profile?.goal === "lose") return cur - amt;
  if (profile?.goal === "gain") return cur + amt;
  return cur;
}

export function goalConfirmation(currentVal, targetVal, unit = "lbs") {
  if (currentVal == null || targetVal == null) return null;
  const diff = +(targetVal - currentVal).toFixed(1);
  const lbl = unit === "kg" ? "kg" : "lbs";
  if (diff > 0.5)
    return { dir: "gain", lbs: diff, text: `That's gaining ${diff} ${lbl} from where you are — sound right?` };
  if (diff < -0.5)
    return { dir: "lose", lbs: Math.abs(diff), text: `That's losing ${Math.abs(diff)} ${lbl} from where you are — sound right?` };
  return { dir: "maintain", lbs: 0, text: "That's right at your current weight — maintaining." };
}

export function deriveGoal(currentKg, targetKg) {
  if (currentKg == null || targetKg == null) return { goal: "maintain", goal_amount: null };
  const diff = targetKg - currentKg;
  if (diff > 0.05) return { goal: "gain", goal_amount: +diff.toFixed(2) };
  if (diff < -0.05) return { goal: "lose", goal_amount: +(-diff).toFixed(2) };
  return { goal: "maintain", goal_amount: null };
}