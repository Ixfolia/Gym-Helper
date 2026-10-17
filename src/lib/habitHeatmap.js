import { format, subDays } from "date-fns";

// Display-only heatmap data for a single habit. Reads existing habit-log
// completion (a Set of done date strings) and builds a GitHub-contribution
// style grid: 7 rows (Sun..Sat) × N weeks of columns, ending at the current
// week. Cells before the habit's createdDate are flagged `before` (rendered
// near-invisible, never a miss) and excluded from the completion stat, which
// counts only the visible, non-future, since-creation span — no storage,
// checking, or reset logic lives here.
export function buildHeatmap(doneDates, weeks = 15, today = new Date(), createdDate = null) {
  const set = doneDates instanceof Set ? doneDates : new Set(doneDates || []);
  const todayStr = format(today, "yyyy-MM-dd");
  const dow = today.getDay(); // 0 Sun .. 6 Sat
  const thisWeekStart = subDays(today, dow); // Sunday of current week
  const firstSunday = subDays(thisWeekStart, (weeks - 1) * 7);

  const columns = [];
  let done = 0;
  let total = 0;
  for (let w = 0; w < weeks; w++) {
    const colSunday = new Date(firstSunday);
    colSunday.setDate(firstSunday.getDate() + w * 7);
    const col = [];
    for (let r = 0; r < 7; r++) {
      const d = new Date(colSunday);
      d.setDate(colSunday.getDate() + r);
      const ds = format(d, "yyyy-MM-dd");
      const future = ds > todayStr;
      const before = createdDate ? ds < createdDate : false;
      const isDone = !future && !before && set.has(ds);
      if (!future && !before) total++;
      if (isDone) done++;
      col.push({ date: ds, dow: r, future, before, done: isDone });
    }
    columns.push(col);
  }
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { columns, stat: { done, total, pct } };
}