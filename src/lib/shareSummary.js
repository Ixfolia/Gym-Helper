import { computeBaseline, computePace, parseTimeframe, currentMaintenance } from "@/lib/metabolism";
import { JOURNEY } from "@/lib/journey";
import { startOfWeek, format } from "date-fns";
import { kgToUnit, unitLabel } from "@/lib/weightUnits";

const fmt = (n) => (n ?? 0).toLocaleString();

function pctLabel(pct) {
  if (pct > 0) return `+${Math.round(pct * 100)}%`;
  if (pct < 0) return `-${Math.round(Math.abs(pct) * 100)}%`;
  return "0%";
}

function journeyLabel(progress) {
  if (!progress || !progress.length) return "Not started";
  const active = progress.find((p) => p.status === "active");
  const target = active || progress.find((p) => p.status === "pending");
  if (!target) {
    return progress.every((p) => p.status === "done") ? "All steps complete" : "Not started";
  }
  for (const phase of JOURNEY) {
    const step = phase.steps.find((s) => s.id === target.step);
    if (step) return `Phase ${phase.phase} — ${phase.name} · ${step.title} (${target.status})`;
  }
  return "Not started";
}

export function buildSummary({ profile, dailyLogs = [], weighIns = [], workoutLogs = [], journeyProgress = [], unit = "lbs" }) {
  const b = computeBaseline(profile);
  const lbl = unitLabel(unit);
  const lines = [];
  lines.push("PEAK SYSTEM — MY NUMBERS");
  lines.push("");
  lines.push(
    `Maintenance: ${fmt(b.baseline)} cal/day (science: ${fmt(b.scienceMaintenance)} · metabolism: ${b.adjName.toLowerCase()}, ${pctLabel(b.adjPct)})`
  );
  lines.push(`Protein target: ${b.protein}g/day`);

  if (b.goalType === "maintain") {
    lines.push("Goal: Maintain · eat to baseline");
  } else {
    const weeks = parseTimeframe(profile.goal_timeframe);
    const p = computePace(b.baseline, b.goalType, b.goalAmount, weeks, profile.sex);
    const word = b.goalType === "lose" ? "Lose" : "Gain";
    const dir = p.isDeficit ? "deficit" : "surplus";
    lines.push(
      `Goal: ${word} ${kgToUnit(b.goalAmount, unit)} ${lbl} in ${weeks} weeks · ${fmt(p.dailyDelta)} cal/day ${dir} · target ${fmt(p.targetIntake)} cal/day`
    );
  }

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  // In-progress week averages use completed days only — today never enters.
  const weekLogs = dailyLogs.filter((l) => {
    const d = l.date || "";
    return d >= weekStart && d < todayStr;
  });
  const avg = (arr, key) => {
    const vals = arr.map((x) => x[key]).filter((v) => typeof v === "number");
    return vals.length ? Math.round(vals.reduce((a, c) => a + c, 0) / vals.length) : null;
  };
  const avgCal = avg(weekLogs, "calories");
  const avgPro = avg(weekLogs, "protein");
  lines.push("");
  lines.push("This week:");
  lines.push(`- Avg calories: ${avgCal != null ? fmt(avgCal) + "/day" : "no logs yet"}`);
  lines.push(`- Avg protein: ${avgPro != null ? fmt(avgPro) + "g/day" : "no logs yet"}`);

  const sorted = [...weighIns]
    .filter((w) => w.date && typeof w.weight === "number")
    .sort((a, b) => a.date.localeCompare(b.date));
  lines.push("");
  if (sorted.length >= 2) {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const delta = +(last.weight - first.weight).toFixed(1);
    const sign = delta > 0 ? "+" : "";
    lines.push(`Weigh-in trend: ${kgToUnit(first.weight, unit)} → ${kgToUnit(last.weight, unit)} ${lbl} (${sign}${kgToUnit(delta, unit)} ${lbl} over ${sorted.length} entries)`);
  } else {
    lines.push("Weigh-in trend: not enough data");
  }

  const weekWorkouts = workoutLogs.filter((l) => (l.date || "") >= weekStart);
  const trainingDays = weekWorkouts.filter((l) => l.status === "done" || l.status === "missed");
  const done = weekWorkouts.filter((l) => l.status === "done").length;
  lines.push("");
  lines.push(`Workouts this week: ${done}/${trainingDays.length || "?"} done`);

  lines.push("");
  lines.push(`Journey: ${journeyLabel(journeyProgress)}`);

  return lines.join("\n");
}

export function buildWeeklySummary({ profile, history = [], journeyProgress = [], week, target, zone, unit = "lbs" }) {
  const b = computeBaseline(profile);
  const m = currentMaintenance(profile, history);
  const lbl = unitLabel(unit);
  const lines = [];
  lines.push("PEAK SYSTEM — WEEKLY REVIEW");
  if (week?.label) lines.push(week.label);
  lines.push("");

  const calTxt =
    week && week.avgCalories != null
      ? `${week.avgCalories.toLocaleString()}/day · target ${target.toLocaleString()} ±${zone} · ${
          week.won ? "in the zone — won" : "outside the zone"
        }`
      : "no calorie logs";
  lines.push(`Avg calories: ${calTxt}`);
  lines.push(
    `Protein: ${
      week && week.avgProtein != null
        ? `${week.avgProtein}g avg (${week.proteinConsistency ?? "—"}% days on target)`
        : "no logs"
    }`
  );
  lines.push(`Habits: ${week && week.habitPct != null ? `${week.habitPct}% checked` : "—"}`);
  lines.push(`Workouts: ${week && week.workoutPct != null ? `${week.workoutPct}% done` : "—"}`);

  const trend =
    week && week.startWi && week.endWi
      ? `${kgToUnit(week.startWi.weight, unit)} → ${kgToUnit(week.endWi.weight, unit)} ${lbl} (${
          week.weightChange >= 0 ? "+" : ""
        }${kgToUnit(week.weightChange, unit)} ${lbl})`
      : "not enough data";
  lines.push(`Weight trend: ${trend}`);

  lines.push("");
  lines.push("Metabolism:");
  lines.push(`- Maintenance: ${m.value.toLocaleString()} cal/day (${m.confidence})`);
  lines.push(`- Profile: ${b.adjName}, ${pctLabel(b.adjPct)}`);

  lines.push("");
  lines.push(`Journey: ${journeyLabel(journeyProgress)}`);

  lines.push("");
  lines.push("Track. Review. Refine. That's the whole game.");
  return lines.join("\n");
}