// Singularity helpers — dedupe entity rows so a duplicate can never double-count
// or show twice. "Most recently updated wins": the row with the latest
// updated_date wins; ties break by the lower id for a stable order.

function moreRecent(a, b) {
  const aU = a?.updated_date || "";
  const bU = b?.updated_date || "";
  if (bU > aU) return b;
  if (bU < aU) return a;
  return (a?.id || "") <= (b?.id || "") ? a : b;
}

export function dedupeBy(rows, keyFn) {
  const map = {};
  for (const r of rows || []) {
    if (!r) continue;
    const k = keyFn(r);
    if (k == null) continue;
    if (!map[k]) {
      map[k] = r;
      continue;
    }
    map[k] = moreRecent(map[k], r);
  }
  return Object.values(map);
}

// DailyLog readers — one row per date (most recently updated wins).
export function dedupeByDate(rows) {
  return dedupeBy(rows, (r) => r?.date);
}

// WeeklySummary readers — one row per week_start (most recently updated wins).
export function dedupeByWeekStart(rows) {
  return dedupeBy(rows, (r) => r?.week_start);
}