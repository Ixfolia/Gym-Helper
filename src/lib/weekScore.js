// Week scoreboard — every consistency percentage is computed within the
// current week only (weigh-in day to weigh-in day). A fresh scoreboard each
// week; never 30-day or all-time.
import { differenceInCalendarDays, format, subDays, addDays } from "date-fns";
import { defaultSchedule } from "./splits";
import { completedSessions } from "./sessionCompletion";

const DAY_IDX = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };

function dateAt(d) {
  return new Date(d + "T12:00:00");
}

// The current week starts on the most recent occurrence of the user's weigh-in
// day on or before today (today is day 1 if today is a weigh-in day), and ends
// the day before the next one. `end` is an exclusive upper bound.
export function currentWeekRange(profile, today = new Date()) {
  const wiDay = profile?.weigh_in_day;
  let startD;
  if (wiDay && DAY_IDX[wiDay] !== undefined) {
    const target = DAY_IDX[wiDay];
    const dow = (today.getDay() + 6) % 7; // Mon=0..Sun=6
    const back = (dow - target + 7) % 7;
    startD = subDays(today, back);
  } else {
    startD = subDays(today, 6);
  }
  return {
    start: format(startD, "yyyy-MM-dd"),
    end: format(addDays(startD, 7), "yyyy-MM-dd"),
  };
}

export function daysElapsedSoFar(range, today = new Date()) {
  return differenceInCalendarDays(today, dateAt(range.start)) + 1;
}

export function trackedPctThisWeek(dailyLogs, range, today = new Date()) {
  const days = daysElapsedSoFar(range, today);
  if (days <= 0) return null;
  const done = new Set(
    (dailyLogs || [])
      .filter(
        (l) =>
          l.date &&
          l.date >= range.start &&
          l.date < range.end &&
          typeof l.calories === "number" &&
          l.calories > 0
      )
      .map((l) => l.date)
  ).size;
  return Math.min(100, Math.round((done / days) * 100));
}

export function habitPctThisWeek(profile, habitLogs, range, today = new Date()) {
  const habits = (profile?.habits || []).filter((h) => h);
  if (!habits.length) return null;
  const days = daysElapsedSoFar(range, today);
  if (days <= 0) return null;
  const possible = habits.length * days;
  const done = (habitLogs || []).filter(
    (h) => h.done && h.date && h.date >= range.start && h.date < range.end
  ).length;
  return Math.min(100, Math.round((done / possible) * 100));
}

export function workoutPctThisWeek(profile, workoutLogs, sessionCompletions, range, today = new Date()) {
  const days = daysElapsedSoFar(range, today);
  const done = completedSessions(workoutLogs, sessionCompletions).filter(
    (s) => s.date >= range.start && s.date < range.end
  ).length;
  // Return null only when there is genuinely nothing to show.
  if (days <= 0 && done === 0) return null;

  let scheduled = 0;
  if (profile?.week_schedule && profile.week_schedule.length === 7) {
    for (let i = 0; i < days; i++) {
      const ds = format(addDays(dateAt(range.start), i), "yyyy-MM-dd");
      if (profile.week_schedule[(dateAt(ds).getDay() + 6) % 7] !== "rest") scheduled++;
    }
  } else if (days > 0) {
    // No valid week_schedule — fall back to cadence: 4 on the 4–6 track, 3 on
    // the 3–5 track, prorated by days elapsed so far this week (rounded up,
    // minimum 1 once the week has started).
    const perWeek = profile?.cadence === "4-6" ? 4 : 3;
    scheduled = Math.max(1, Math.ceil((perWeek * days) / 7));
  }

  // Completed work is never hidden — if nothing was scheduled but work got
  // done, show full credit.
  if (!scheduled && done > 0) return 100;
  if (!scheduled) return null;
  return Math.min(100, Math.round((done / scheduled) * 100));
}

// Consecutive-day streaks up to today — the flame counts. Reset naturally on a
// missed day; never shames, just reflects momentum.
export function trackingStreak(logs, today = new Date()) {
  const set = new Set(
    (logs || [])
      .filter((l) => l.date && typeof l.calories === "number" && l.calories > 0)
      .map((l) => l.date)
  );
  let streak = 0;
  let cur = today;
  while (set.has(format(cur, "yyyy-MM-dd"))) {
    streak++;
    cur = subDays(cur, 1);
  }
  return streak;
}

export function habitStreak(profile, habitLogs, today = new Date()) {
  const habits = (profile?.habits || []).filter((h) => h);
  if (!habits.length) return 0;
  const byDate = {};
  for (const l of habitLogs || []) {
    if (!l.date) continue;
    (byDate[l.date] = byDate[l.date] || {})[l.habit_name] = !!l.done;
  }
  let streak = 0;
  let cur = today;
  while (true) {
    const day = byDate[format(cur, "yyyy-MM-dd")];
    if (day && habits.every((h) => day[h])) {
      streak++;
      cur = subDays(cur, 1);
    } else break;
  }
  return streak;
}

// Per-habit weekly stats for the Habits screen: a completion % that resets each
// week and a streak counting consecutive done-days ending today within the week.
export function habitWeeklyStats(name, habitLogs, range, today = new Date()) {
  const doneDates = new Set(
    (habitLogs || [])
      .filter((l) => l.habit_name === name && l.done && l.date)
      .map((l) => l.date)
  );
  const days = daysElapsedSoFar(range, today);
  let doneInWeek = 0;
  for (let i = 0; i < days; i++) {
    if (doneDates.has(format(addDays(dateAt(range.start), i), "yyyy-MM-dd"))) doneInWeek++;
  }
  const pct = days > 0 ? Math.min(100, Math.round((doneInWeek / days) * 100)) : 0;
  let streak = 0;
  let cur = today;
  for (let i = 0; i < days; i++) {
    if (doneDates.has(format(cur, "yyyy-MM-dd"))) {
      streak++;
      cur = subDays(cur, 1);
    } else break;
  }
  return { streak, pct, days, doneInWeek };
}