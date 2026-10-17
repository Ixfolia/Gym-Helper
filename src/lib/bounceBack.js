// "Bounce back" notice — fires once per day whose logged calories exceed the
// member's allowed ceiling by more than 800 kcal. Ceiling = target for
// lose/maintain, band top (maintenance + 500) for gain. Dismissal is stored
// per-day in localStorage so it triggers at most once per overage day.
import { differenceInCalendarDays, format, addDays } from "date-fns";
import { computeDailyTarget } from "@/lib/winningWeek";
import { currentWeekRange } from "@/lib/weekScore";

export const BOUNCE_BACK_DISMISS_KEY = "peak_bounceback_dismissed";

// Bounce-back target for a day that follows a >800-kcal overage earlier this
// week. The daily target is trimmed so the running weekly average still lands
// on plan, capped at a 750-kcal cut (never starve). Returns null when there's
// no overage to recover or the week is already back on plan.
//   bounceBackTarget = max(dailyTarget − (weekOverage / remainingDaysInWeek),
//                           dailyTarget − 750)
// where weekOverage = consumed(elapsed days) − dailyTarget × elapsed.
export function bounceBackTargetFor({ profile, history, dailyLogs, today = new Date() }) {
  if (!profile) return null;
  const { maintenance, target } = computeDailyTarget(profile, history || []);
  if (!target) return null;
  const ceiling = profile.goal === "gain" ? maintenance + 500 : target;
  const range = currentWeekRange(profile, today);
  const start = new Date(range.start + "T12:00:00");
  const elapsed = Math.max(0, differenceInCalendarDays(today, start)); // days before today
  const remaining = 7 - elapsed;
  if (remaining < 1) return null;

  const byDate = {};
  for (const l of dailyLogs || []) {
    if (l && l.date && l.date >= range.start && l.date < range.end && typeof l.calories === "number" && !l.voided) {
      byDate[l.date] = l.calories;
    }
  }

  let consumed = 0;
  let hasOverage = false;
  for (let i = 0; i < elapsed; i++) {
    const dStr = format(addDays(start, i), "yyyy-MM-dd");
    const cals = byDate[dStr];
    consumed += typeof cals === "number" ? cals : target; // unlogged day = on plan
    if (typeof cals === "number" && cals - ceiling > 800) hasOverage = true;
  }
  if (!hasOverage) return null;
  const weekOverage = consumed - target * elapsed;
  if (weekOverage <= 0) return null; // week already back on plan
  const bbTarget = Math.max(target - weekOverage / remaining, target - 750);
  return {
    target: Math.round(bbTarget),
    weekOverage: Math.round(weekOverage),
    remaining,
  };
}

export const BOUNCE_BACK_HACKS = [
  "Run 16:8 intermittent fasting tomorrow and lead every meal with protein — you'll average out the week.",
  "Front-load protein at breakfast and push carbs to your last meal — you'll wake up leveled out.",
  "Add a 30-minute walk tomorrow and keep your next three meals protein-forward — the week absorbs one big day.",
];

export function bounceBackCeiling(profile, maintenance, target) {
  return profile?.goal === "gain" ? maintenance + 500 : target;
}

function hashDate(d) {
  let h = 0;
  for (const c of String(d || "")) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Find the most recent logged day exceeding the ceiling by > 800 kcal.
// Returns { date, over, hack } or null. Pass a single-log array to scope to one
// day (used by the Fuel log screen for the "log food" trigger).
export function findBounceBackDay({ profile, history, dailyLogs }) {
  if (!profile || !Array.isArray(dailyLogs) || !dailyLogs.length) return null;
  const { maintenance, target } = computeDailyTarget(profile, history || []);
  const ceiling = bounceBackCeiling(profile, maintenance, target);
  if (!ceiling) return null;
  const sorted = [...dailyLogs]
    .filter((l) => l && typeof l.calories === "number" && !l.voided)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  for (const l of sorted) {
    const over = l.calories - ceiling;
    if (over > 800) {
      return {
        date: l.date,
        over: Math.round(over),
        hack: BOUNCE_BACK_HACKS[hashDate(l.date) % BOUNCE_BACK_HACKS.length],
      };
    }
  }
  return null;
}

export function dismissedBounceBack() {
  try {
    return localStorage.getItem(BOUNCE_BACK_DISMISS_KEY);
  } catch {
    return null;
  }
}

export function dismissBounceBack(date) {
  try {
    localStorage.setItem(BOUNCE_BACK_DISMISS_KEY, date);
  } catch {
    /* storage unavailable — in-memory hide still works for the session */
  }
}