// Weight-delta color doctrine v2 — one shared helper for every weight-delta
// readout. Returns { tone, intensity, glow }:
//   tone      "green" | "orange"
//   intensity 1 (faint) | 2 (medium) | 3 (deep, + glow)
//   glow      a CSS text-shadow string ("none" when no glow)
//
// No red anywhere — the dashboard hypes, the coach course-corrects:
//  • Toward the goal → green; deeper + glowing as current weight nears the goal.
//  • Against the goal by a small amount → faint light green, never orange.
//  • Losing faster than the sustainable pace (lose goal) → green but dimmed.
//  • "maintain": within ±2 lbs of goal → full green; drifting → faint green.
//  • Orange ONLY for a monthly outlier: cumulative calendar-month gain over
//    +5 lbs (lose) or +10 lbs (gain). New month → clean slate.

import { parseTimeframe } from "./metabolism";

const LBS_PER_KG = 2.2046226218;

const GREEN = {
  1: "#6EE7B7", // faint light green
  2: "#34D399", // base green
  3: "#10B981", // deep green
};
const ORANGE = "#F5A623"; // existing amber token

function kgToLbs(kg) {
  return (Number(kg) || 0) * LBS_PER_KG;
}

function sustainableWeeklyLbs(profile) {
  const amt = Math.abs(profile?.goal_amount || 0);
  const weeks = parseTimeframe(profile?.goal_timeframe) || 12;
  if (!amt || !weeks) return 0;
  return kgToLbs(amt / weeks);
}

function greenGlow(alpha = 0.45) {
  return `0 0 18px rgba(52,211,153,${alpha}), 0 0 40px rgba(52,211,153,${(alpha * 0.4).toFixed(2)})`;
}
function orangeGlow(alpha = 0.45) {
  return `0 0 18px rgba(245,166,35,${alpha}), 0 0 40px rgba(245,166,35,${(alpha * 0.4).toFixed(2)})`;
}

export function deltaAppearance({ profile, weighIns, deltaLbs }) {
  const goal = profile?.goal || "maintain";
  const dLbs = Number(deltaLbs) || 0;

  const sorted = (weighIns || [])
    .filter((w) => w && w.date && typeof w.weight === "number")
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  const latestKg = sorted.length ? sorted[sorted.length - 1].weight : profile?.current_weight;
  const baseKg = profile?.current_weight || latestKg;
  const amt = profile?.goal_amount || 0;
  let goalKg = baseKg;
  if (goal === "lose") goalKg = baseKg - amt;
  else if (goal === "gain") goalKg = baseKg + amt;

  // Cumulative gain within the current calendar month (lbs).
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthRows = sorted.filter((w) => w.date.startsWith(monthKey));
  let monthGainLbs = 0;
  if (monthRows.length >= 2) {
    monthGainLbs = kgToLbs(monthRows[monthRows.length - 1].weight - monthRows[0].weight);
  }

  // Orange ONLY for a monthly outlier.
  if ((goal === "lose" && monthGainLbs > 5) || (goal === "gain" && monthGainLbs > 10)) {
    return { tone: "orange", intensity: 3, glow: orangeGlow(0.5) };
  }

  // Closeness to goal weight (0..1) — drives green depth.
  const initialGap = Math.abs(amt) || 5;
  const remaining = Math.abs((latestKg || 0) - goalKg);
  const closeness = Math.max(0, Math.min(1, 1 - remaining / Math.max(initialGap, 0.1)));

  // Losing faster than the sustainable pace (lose goal) → green, dimmed.
  const wkly = sustainableWeeklyLbs(profile);
  let tooFast = false;
  if (goal === "lose" && monthRows.length >= 2 && wkly > 0) {
    const monthLossLbs = -monthGainLbs; // positive = lost
    if (monthLossLbs > wkly * 4 * 1.5) tooFast = true;
  }

  let intensity = 1;
  let glow = "none";

  if (goal === "maintain") {
    const distLbs = Math.abs(kgToLbs((latestKg || 0) - goalKg));
    if (distLbs <= 2) {
      intensity = 3;
      glow = greenGlow(0.5);
    } else {
      intensity = 1;
    }
  } else {
    const toward = goal === "lose" ? dLbs < -0.05 : goal === "gain" ? dLbs > 0.05 : false;
    if (toward && !tooFast) {
      intensity = closeness >= 0.66 ? 3 : closeness >= 0.33 ? 2 : 1;
      if (intensity === 3) glow = greenGlow(0.5);
    } else {
      // Against the goal by a small amount, or losing too fast → faint/dimmed green.
      intensity = 1;
    }
  }

  return { tone: "green", intensity, glow };
}

// Resolve { tone, intensity } to a hex color — kept here so both surfaces share
// one color mapping (no duplicated color logic anywhere).
export function deltaHex({ tone, intensity }) {
  if (tone === "orange") return ORANGE;
  return GREEN[Math.max(1, Math.min(3, intensity || 1))] || GREEN[1];
}