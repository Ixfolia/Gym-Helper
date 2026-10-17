// The Reset Protocol — calm, zero-shame. Falling off is normal; staying off is
// the only failure. History is data, never shame.
import { differenceInCalendarDays, format } from "date-fns";
import { db } from "@/api/db";

function dateAt(d) {
  return new Date(d + "T12:00:00");
}

// Days since the most recent real entry across any tracked surface.
// Returns null if nothing has ever been logged (no baseline to judge against).
export function daysSinceLastEntry({ dailyLogs, weighIns, workoutLogs, habitLogs }) {
  const today = new Date();
  const dates = [];
  for (const l of dailyLogs || [])
    if (l.date && typeof l.calories === "number" && l.calories > 0) dates.push(l.date);
  for (const w of weighIns || []) if (w.date) dates.push(w.date);
  for (const w of workoutLogs || []) if (w.date && w.status === "done") dates.push(w.date);
  for (const h of habitLogs || []) if (h.date && h.done) dates.push(h.date);
  if (!dates.length) return null;
  const latest = dates.sort().pop();
  return Math.max(0, differenceInCalendarDays(today, dateAt(latest)));
}

export function needsReset(ctx) {
  const d = daysSinceLastEntry(ctx);
  return d != null && d >= 10;
}

// Enough data to meaningfully offer a maintenance refinement after a reset.
export function refinementSupported(dailyLogs, weighIns) {
  const loggedDays = new Set(
    (dailyLogs || [])
      .filter((l) => l.date && typeof l.calories === "number" && l.calories > 0)
      .map((l) => l.date)
  ).size;
  const wi = (weighIns || []).filter((w) => w.date && typeof w.weight === "number").length;
  return loggedDays >= 14 && wi >= 2;
}

// Starts a fresh week from today. Clears nothing — only marks the reset date
// so the current winning-week period restarts here.
export async function performReset(profile) {
  const today = format(new Date(), "yyyy-MM-dd");
  if (profile?.id) {
    return await db.entities.Profile.update(profile.id, { reset_date: today });
  }
  return null;
}