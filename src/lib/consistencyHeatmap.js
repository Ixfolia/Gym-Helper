import { format, subDays } from "date-fns";

// Display-only combined consistency grid for the Home "CONSISTENCY" card.
// Per day, counts how many of the three existing pillars showed up:
//   - workout completed (WorkoutLog status "done" that day)
//   - fuel logged (DailyLog with calories > 0 that day)
//   - habits checked (all configured habits done that day; pillar is N/A
//     when the user has no habits configured)
// Returns a level per day: 0 none, 1 partial, 2 full. No data is written or
// changed — this only reads existing logs.
export function buildConsistencyHeatmap({
  workoutLogs,
  dailyLogs,
  habitLogs,
  habits,
  weeks = 11,
  today = new Date(),
}) {
  const habitNames = (habits || []).filter((h) => h);
  const hasHabits = habitNames.length > 0;

  const workoutDays = new Set(
    (workoutLogs || []).filter((w) => w.status === "done" && w.date).map((w) => w.date)
  );
  const fuelDays = new Set(
    (dailyLogs || [])
      .filter((l) => l.date && typeof l.calories === "number" && l.calories > 0)
      .map((l) => l.date)
  );
  const habitDoneByDate = {};
  for (const l of habitLogs || []) {
    if (l.done && l.date) habitDoneByDate[l.date] = (habitDoneByDate[l.date] || 0) + 1;
  }
  const habitsFull = (date) => hasHabits && (habitDoneByDate[date] || 0) >= habitNames.length;

  const todayStr = format(today, "yyyy-MM-dd");
  const dow = today.getDay(); // 0 Sun .. 6 Sat
  const thisWeekStart = subDays(today, dow);
  const firstSunday = subDays(thisWeekStart, (weeks - 1) * 7);

  const columns = [];
  for (let w = 0; w < weeks; w++) {
    const colSunday = new Date(firstSunday);
    colSunday.setDate(firstSunday.getDate() + w * 7);
    const col = [];
    for (let r = 0; r < 7; r++) {
      const dt = new Date(colSunday);
      dt.setDate(colSunday.getDate() + r);
      const ds = format(dt, "yyyy-MM-dd");
      const future = ds > todayStr;
      let level = 0;
      if (!future) {
        const active = 2 + (hasHabits ? 1 : 0);
        let done =
          (workoutDays.has(ds) ? 1 : 0) +
          (fuelDays.has(ds) ? 1 : 0) +
          (hasHabits ? (habitsFull(ds) ? 1 : 0) : 0);
        const ratio = active > 0 ? done / active : 0;
        if (ratio >= 1) level = 2;
        else if (ratio > 0) level = 1;
      }
      col.push({ date: ds, dow: r, future, level });
    }
    columns.push(col);
  }
  return { columns };
}