// Semantic fuel-indicator color system, driven by the member's goal.
// Explicitly requested green/amber/soft-red for calorie delta + protein — this
// overrides the default electric-blue-only rule for these indicators.
//
// DOCTRINE: being under target is never punished, and today is never judged.
//   • For EVERY goal, intake below target is GREEN (never amber).
//   • intensity (0–1) rises with closeness to target — lose goals floor at
//     0.65, gain/maintain floor at 0.4, both reach 1 at target.
//   • At target (and for gain goals anywhere up to the growth-band top) it is
//     full green, intensity 1.
//   • Everything past target (lose/maintain) or past the band top (gain) keeps
//     the existing amber → soft-red ramp and thresholds.
//   • text: dayComplete=false (today) → progress language only; dayComplete=true
//     (a past day) → verdict-style lines for under/in. Over lines are unchanged.
// PROTEIN: below 70% → brand blue today (amber only on past days); 70–100% →
//   light green "near"; ≥100% → full green "met". Never negative for going over.
// No food logged yet → every indicator neutral slate.

export const FUEL_COLORS = {
  green: "#34D399",
  amber: "#F5A623",
  softRed: "#F87171",
  blue: "#1E9BFF",
  slate: "#94A3B8",
};

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function hexToRgb(h) {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function rgbToHex(rgb) {
  return (
    "#" +
    rgb
      .map((x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, "0"))
      .join("")
  );
}
export function mixHex(a, b, t) {
  t = clamp(t, 0, 1);
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

function fmt(n) {
  return Math.round(n).toLocaleString();
}

// Calorie delta status. Returns null when no food is logged (intake null/0).
// dayComplete=false (today) → progress text; true (a past day) → verdict text.
// Always returns delta (signed) and intensity (0–1). Under-target is always
// green regardless of dayComplete — only the wording changes.
export function calorieStatus({ goal, intake, target, maintenance, dayComplete = false }) {
  const v = Number(intake);
  if (!v || !isFinite(v) || v <= 0) return null;
  const t = Number(target) || 0;
  const m = Number(maintenance) || 0;
  const C = FUEL_COLORS;
  const delta = v - t;

  // intensity ramps from a goal-specific floor up to 1 as intake → target.
  const underInt = (ratio) => {
    const start = goal === "lose" ? 0.65 : 0.4;
    return clamp(start + (1 - start) * clamp(ratio, 0, 1), 0, 1);
  };

  if (goal === "gain") {
    const bandTop = m + 500;
    if (v < t) {
      return {
        hex: C.green,
        kind: "under",
        intensity: underInt(v / (t || 1)),
        delta,
        text: dayComplete
          ? `↓ −${fmt(t - v)} kcal to target · add fuel`
          : `−${fmt(t - v)} kcal to target`,
      };
    }
    if (v <= bandTop) {
      return {
        hex: C.green,
        kind: "in",
        intensity: 1,
        delta,
        text: dayComplete ? `in the growth band` : `on target`,
      };
    }
    const overBand = v - bandTop;
    if (overBand <= 650) {
      return { hex: C.amber, kind: "over", intensity: 1, delta, text: `↑ +${fmt(overBand)} kcal past the band · ease back a touch` };
    }
    const tt = clamp((overBand - 650) / 850, 0, 1);
    return {
      hex: mixHex(C.amber, C.softRed, tt),
      kind: "over",
      intensity: 1,
      delta,
      text: `↑ +${fmt(overBand)} kcal past the band · pull back to recover`,
    };
  }

  // lose + maintain: ceiling = target
  if (Math.abs(delta) <= 0.5) {
    return { hex: C.green, kind: "in", intensity: 1, delta, text: dayComplete ? `on target — dialed in` : `on target` };
  }
  if (delta < 0) {
    return {
      hex: C.green,
      kind: "under",
      intensity: underInt(v / (t || 1)),
      delta,
      text: dayComplete ? `↓ −${fmt(-delta)} kcal room left` : `−${fmt(-delta)} kcal to target`,
    };
  }
  const over = delta;
  if (over <= 650) {
    return { hex: C.amber, kind: "over", intensity: 1, delta, text: `↑ +${fmt(over)} kcal over · you can bounce back tomorrow` };
  }
  const tt = clamp((over - 650) / 850, 0, 1);
  return {
    hex: mixHex(C.amber, C.softRed, tt),
    kind: "over",
    intensity: 1,
    delta,
    text: `↑ +${fmt(over)} kcal over · regroup tomorrow`,
  };
}

// Protein status. dayComplete=false (today) → brand blue filling bar below 70%
// (no judgment); dayComplete=true (past day) → amber below 70%. 70–100% → light
// green "near"; ≥100% → full green "met". Slate when no food. Never negative
// for going over. Returns kind, hex, pct, and signed delta.
export function proteinStatus({ intake, target, dayComplete = false }) {
  const v = Number(intake);
  if (!v || !isFinite(v) || v <= 0) return { hex: FUEL_COLORS.slate, kind: "none", pct: 0, delta: 0 };
  const tg = Number(target) || 0;
  if (tg <= 0) return { hex: FUEL_COLORS.blue, kind: "below", pct: 0, delta: v };
  const pct = v / tg;
  const delta = v - tg;
  if (pct >= 1) return { hex: FUEL_COLORS.green, kind: "met", pct: Math.round(pct * 100), delta };
  if (pct >= 0.7) return { hex: "#6EE7B7", kind: "near", pct: Math.round(pct * 100), delta };
  return { hex: dayComplete ? FUEL_COLORS.amber : FUEL_COLORS.blue, kind: "below", pct: Math.round(pct * 100), delta };
}