// Streak → badge tier mapping. Thresholds are simple constants: edit this
// array to change the tiers. A streak count maps to the highest tier whose
// `min` it reaches.
// Streak → badge tier mapping. `glowColor` is the dominant color of each tier's
// pixel icon — used for the streak badge glow so the glow always matches the
// icon, never blue: flame → warm orange-red, crown/trophy → gold, etc. Edit
// this array to change the tiers.
export const STREAK_TIERS = [
  { min: 0, badge: "fire", glowColor: "#FF6A2B" }, // days 1–9 (and 0) — flame
  { min: 10, badge: "flex", glowColor: "#F59E0B" }, // days 10–49 — flex
  { min: 50, badge: "trophy", glowColor: "#FACC15" }, // days 50–99 — trophy
  { min: 100, badge: "crown", glowColor: "#FFD700" }, // days 100+ — crown
];

// The dominant color of the tier's pixel icon — drives the streak badge glow.
export function streakGlowColor(count) {
  const c = Math.max(0, Math.floor(count || 0));
  let color = STREAK_TIERS[0].glowColor;
  for (const t of STREAK_TIERS) if (c >= t.min) color = t.glowColor;
  return color;
}

export function streakBadgeFor(count) {
  const c = Math.max(0, Math.floor(count || 0));
  let badge = STREAK_TIERS[0].badge;
  for (const t of STREAK_TIERS) if (c >= t.min) badge = t.badge;
  return badge;
}

export function streakTierIndex(count) {
  const c = Math.max(0, Math.floor(count || 0));
  let idx = 0;
  for (let i = 0; i < STREAK_TIERS.length; i++) if (c >= STREAK_TIERS[i].min) idx = i;
  return idx;
}