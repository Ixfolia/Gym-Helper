import { format, subDays, addDays } from "date-fns";

// 30-day window stats for a Coach's Read tile. `doneSet` is the set of done date
// strings; `startStr` (optional) is the tile's creation/first-log date — days
// before it are excluded so a brand-new habit isn't graded against empty days.
// `dataDays` is the eligible span length (capped at 30), used by the read's
// "14 days of data" flag gate.
export function windowStats(doneSet, startStr, today = new Date()) {
  const set = doneSet instanceof Set ? doneSet : new Set(doneSet || []);
  const todayStr = format(today, "yyyy-MM-dd");
  const winStartStr = format(subDays(today, 29), "yyyy-MM-dd");
  const effStart = startStr && startStr > winStartStr ? startStr : winStartStr;
  let eligible = 0;
  let done = 0;
  let d = new Date(effStart + "T12:00:00");
  while (format(d, "yyyy-MM-dd") <= todayStr) {
    const ds = format(d, "yyyy-MM-dd");
    eligible++;
    if (set.has(ds)) done++;
    d = addDays(d, 1);
  }
  return { pct: eligible > 0 ? Math.round((done / eligible) * 100) : 0, dataDays: eligible, done };
}

// Rotating sentence endings for the Coach's Read. Praise and flag endings
// each rotate deterministically by tile position (index) so the text never
// repeats within a single read and never randomizes per render.
const PRAISE_ENDINGS = [
  "— you're crushing it.",
  "— the habit is forming.",
  "— creating a stronger identity. Let's go.",
];
const FLAG_ENDINGS = [
  "— opportunities this week move that average up.",
  "— could be an area to work on.",
  "— there are more wins here you can stack.",
];

// Deterministic Coach's Read over the trailing-30-day tiles. Reward first,
// then at most a gentle flag. Praise only tiles at 50%+; if fewer than two
// qualify, praise the single best and add a warm base-building line. Flag at
// most the two lowest tiles, and only if a tile is below 60% AND has at least
// 14 days of data. If nothing qualifies for a flag, the read is pure praise.
export function buildCoachRead(tiles) {
  const list = (tiles || []).filter(
    (t) => t && typeof t.pct === "number" && typeof t.dataDays === "number"
  );
  const qual = list.filter((t) => t.pct >= 50).sort((a, b) => b.pct - a.pct);
  const praise = qual.slice(0, 2).map((t, i) => ({
    key: t.key,
    label: t.label,
    pct: t.pct,
    ending: PRAISE_ENDINGS[i % PRAISE_ENDINGS.length],
  }));
  const warmLine =
    qual.length < 2
      ? "The base is still forming — keep stacking days and the percentages climb on their own."
      : null;
  // Never flag a tile we just praised — reward first, then a gentle flag.
  const praisedKeys = new Set(praise.map((p) => p.key));
  const flaggable = list
    .filter((t) => t.pct < 60 && t.dataDays >= 14 && !praisedKeys.has(t.key))
    .sort((a, b) => a.pct - b.pct);
  const flags = flaggable
    .slice(0, 2)
    .map((t, i) => ({ label: t.label, pct: t.pct, ending: FLAG_ENDINGS[i % FLAG_ENDINGS.length] }));
  return { praise, warmLine, flags };
}