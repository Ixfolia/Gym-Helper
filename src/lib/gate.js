// The First Real Transformation Gate — fully objective, no judgment.
// Five data floors; all must be met to certify and unlock Phase 4.
import { differenceInDays } from "date-fns";
import { currentMaintenance } from "./metabolism";
import { computeWinningWeeks } from "./winningWeek";
import { kgToUnit, unitLabel } from "./weightUnits";

function goalWord(goal) {
  return goal === "lose" ? "down" : goal === "gain" ? "up" : "steady";
}

export function evaluateGate(ctx) {
  const { profile, logs, weighIns, history, habitLogs, workoutLogs, photos, sessionCompletions } = ctx;
  const unit = ctx.unit || "lbs";
  const lbl = unitLabel(unit);

  // Floor 1 — 12+ weeks of tracking history.
  const logged = (logs || [])
    .filter((l) => l.date && typeof l.calories === "number" && l.calories > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
  const firstLog = logged[0]?.date;
  const weeksTracked = firstLog
    ? Math.floor(differenceInDays(new Date(), new Date(firstLog + "T12:00:00")) / 7)
    : 0;
  const f1Met = weeksTracked >= 12;

  // Floor 2 — maintenance confidence = Dialed In.
  const conf = currentMaintenance(profile, history).confidence;
  const f2Met = conf === "Dialed In";

  // Floor 3 — 6+ winning weeks banked (distinct won week_starts, non-consecutive).
  const ww = computeWinningWeeks(
    profile,
    logs,
    weighIns,
    habitLogs,
    workoutLogs,
    history,
    sessionCompletions,
    ctx.weeklySummaries,
    ctx.journeyProgress
  );
  const wonWeeks = new Set(ww.periods.filter((p) => p.won).map((p) => p.week_start)).size;
  const f3Met = wonWeeks >= 6;

  // Floor 4 — 3+ Mirror Checks in the vault.
  const mirrorCount = (photos || []).length;
  const f4Met = mirrorCount >= 3;

  // Floor 5 — weight trend moved toward the goal.
  const ws = (weighIns || [])
    .filter((w) => w.date && typeof w.weight === "number")
    .sort((a, b) => a.date.localeCompare(b.date));
  const goal = profile?.goal || "maintain";
  let f5Met = false;
  let delta = 0;
  if (ws.length >= 2) {
    delta = +(ws[ws.length - 1].weight - ws[0].weight).toFixed(1);
    if (goal === "lose") f5Met = delta <= -0.1;
    else if (goal === "gain") f5Met = delta >= 0.1;
    else f5Met = Math.abs(delta) <= 1.5;
  }

  const floors = [
    {
      id: "weeks",
      label: "12+ weeks of tracking",
      met: f1Met,
      value: `${weeksTracked} weeks`,
      target: 12,
      missing: f1Met
        ? null
        : `${Math.max(0, 12 - weeksTracked)} more weeks — keep showing up.`,
      path: "Log fuel daily; the weeks add themselves.",
    },
    {
      id: "dialed",
      label: "Maintenance dialed in",
      met: f2Met,
      value: conf,
      target: "Dialed In",
      missing: f2Met
        ? null
        : `Confidence is ${conf} — refine maintenance from your Fuel data.`,
      path: "Hit your targets consistently and run a refinement.",
    },
    {
      id: "wins",
      label: "6+ winning weeks banked",
      met: f3Met,
      value: `${wonWeeks} won`,
      target: 6,
      missing: f3Met
        ? null
        : `${Math.max(0, 6 - wonWeeks)} more winning week${
            6 - wonWeeks === 1 ? "" : "s"
          } — win the week (nutrition plus a pillar).`,
      path: "Land a winning week — hit your nutrition rule and add a workouts or habits pillar.",
    },
    {
      id: "mirror",
      label: "3+ Mirror Checks in the vault",
      met: f4Met,
      value: `${mirrorCount} photos`,
      target: 3,
      missing: f4Met
        ? null
        : `${Math.max(0, 3 - mirrorCount)} more Mirror Check${
            3 - mirrorCount === 1 ? "" : "s"
          } — one a month, same lighting.`,
      path: "Add a front-pose photo on your next monthly Mirror Check.",
    },
    {
      id: "trend",
      label: "Weight trend moved toward goal",
      met: f5Met,
      value: ws.length >= 2 ? `${delta > 0 ? "+" : ""}${kgToUnit(delta, unit)} ${lbl}` : "—",
      target: `toward ${goalWord(goal)}`,
      missing: f5Met
        ? null
        : ws.length < 2
        ? "Add weigh-ins to show the trend."
        : `Trend hasn't moved ${goalWord(goal)} yet — ${
            delta > 0 ? "up" : delta < 0 ? "down" : "flat"
          } ${kgToUnit(Math.abs(delta), unit)} ${lbl} so far.`,
      path: "Stay consistent with your fuel target; the trend follows the data.",
    },
  ];

  return {
    floors,
    allMet: floors.every((f) => f.met),
    weeksTracked,
    wonWeeks,
    mirrorCount,
    delta,
    goal,
  };
}