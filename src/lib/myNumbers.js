// "Copy my numbers": a plain-text snapshot of the member's app data, written
// to be pasted into a chat with their coach (e.g. a Claude Project that holds
// the AM Coach documents). It stands in for Base44's cross-app data access:
// the coach can't read the app, so the app hands over what it would have seen.
import { format, subDays } from "date-fns";
import { db } from "@/api/db";
import { computeBaseline, currentMaintenance, dailyProteinTarget } from "@/lib/metabolism";
import { computeDailyTarget } from "@/lib/winningWeek";
import { evaluateAll, dedupeJourneyProgress, derivePhaseStep } from "@/lib/journeyEngine";
import { dedupeByDate } from "@/lib/dedupe";
import { kgToUnit, unitLabel } from "@/lib/weightUnits";

const DAYS_OF_LOGS = 21;

export async function loadMyNumbersData() {
  const e = db.entities;
  const [profiles, logs, weighIns, workoutLogs, sessionCompletions, habitLogs, history, weeklySummaries, journeyRows, progressPhotos] =
    await Promise.all([
      e.Profile.list(),
      e.DailyLog.list("-date", 200),
      e.WeighIn.list("-date", 100),
      e.WorkoutLog.list("-date", 200),
      e.SessionCompletion.list("-date", 200),
      e.HabitLog.list("-date", 600),
      e.MaintenanceHistory.list("-date", 50),
      e.WeeklySummary.list("-date", 50),
      e.JourneyProgress.list(),
      e.ProgressPhoto.list("-date", 20),
    ]);
  return {
    profile: profiles[0] || null,
    logs,
    weighIns,
    workoutLogs,
    sessionCompletions,
    habitLogs,
    history,
    weeklySummaries,
    journeyRows,
    progressPhotos,
  };
}

const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export function buildMyNumbers(data, now = new Date()) {
  const { profile } = data;
  const today = format(now, "yyyy-MM-dd");
  const lines = [
    `PEAK SYSTEM — MY NUMBERS (copied from my app ${format(now, "EEEE yyyy-MM-dd HH:mm")}, my local time)`,
    "Read this as my current app data. Today may still be in progress.",
  ];

  if (!profile) {
    lines.push("", "I haven't finished onboarding in the app yet: no profile, targets or logs exist.");
    return lines.join("\n");
  }

  const unit = profile.weight_unit === "kg" ? "kg" : "lbs";
  const lbl = unitLabel(unit);
  const w = (kg) => (typeof kg === "number" ? `${kgToUnit(kg, unit)} ${lbl}` : "—");

  // ---- profile & targets
  const b = safe(() => computeBaseline(profile));
  const m = safe(() => currentMaintenance(profile, data.history));
  const t = safe(() => computeDailyTarget(profile, data.history, now));
  lines.push(
    "",
    "PROFILE",
    `- Sex ${profile.sex || "—"}, age ${profile.age ?? "—"}, height ${profile.height ? Math.round(profile.height) + " cm" : "—"}, current weight ${w(profile.current_weight)}`,
    `- Activity: ${profile.activity_level || "—"} · training cadence ${profile.cadence || "—"} days (track ${profile.track || "—"})`,
    `- Goal: ${profile.goal || "—"}${profile.goal_amount ? ` ${w(profile.goal_amount)}` : ""}${profile.goal_timeframe ? ` in ${profile.goal_timeframe}` : ""} · weigh-in day: ${profile.weigh_in_day || "—"}`,
    `- Habits: ${(profile.habits || []).filter(Boolean).join(", ") || "none set"}`,
    `- Travel mode: ${profile.travel_mode ? "on" : "off"} · retargeting picks: ${(profile.retarget_areas || []).map((a) => (typeof a === "string" ? a : a?.area || JSON.stringify(a))).join(", ") || "none"}`,
    "",
    "TARGETS (what the app shows)",
    `- Maintenance: ${m?.value != null ? Math.round(m.value) + " kcal" : "—"} (confidence: ${m?.confidence || "—"}${m?.source === "manual" ? ", set with coach" : ""})`,
    `- Science estimate: ${b?.scienceMaintenance ?? "—"} kcal · metabolism profile: ${b?.adjName || "—"}`,
    `- Daily calorie target: ${t?.target != null ? Math.round(t.target) + " kcal" : "—"}${profile.custom_target ? " (custom)" : ""}${t?.periodized ? ` (periodized; weekly average ${Math.round(t.weeklyAverage)})` : ""}`,
    `- Protein target: ${safe(() => dailyProteinTarget(profile)) ?? "—"} g${Number.isFinite(profile.protein_override_g) ? " (custom)" : ""}`
  );

  // ---- journey
  const journey = safe(() => {
    const { byStep } = dedupeJourneyProgress(data.journeyRows);
    const evalMap = evaluateAll({
      profile,
      logs: data.logs,
      weighIns: data.weighIns,
      workoutLogs: data.workoutLogs,
      sessionCompletions: data.sessionCompletions,
      habitLogs: data.habitLogs,
      history: data.history,
      weeklySummaries: data.weeklySummaries,
      progressPhotos: data.progressPhotos,
    });
    return derivePhaseStep(evalMap, byStep);
  });
  lines.push(
    "",
    "JOURNEY",
    journey ? `- ${journey.label}${journey.allDone ? " — all steps complete" : ` · current step: ${journey.stepTitle}`}` : "- unavailable",
    `- Mirror Check photos: ${data.progressPhotos.length}`
  );

  // ---- daily fuel logs (last N days, one line per day so gaps are visible)
  const byDate = new Map(dedupeByDate(data.logs).map((l) => [l.date, l]));
  lines.push("", `FUEL LOG — last ${DAYS_OF_LOGS} days (today is ${today})`);
  for (let i = DAYS_OF_LOGS - 1; i >= 0; i--) {
    const d = format(subDays(now, i), "yyyy-MM-dd");
    const l = byDate.get(d);
    const dow = format(subDays(now, i), "EEE");
    if (!l || !(l.calories > 0)) lines.push(`- ${d} ${dow}: not tracked`);
    else lines.push(`- ${d} ${dow}: ${Math.round(l.calories)} kcal, ${Math.round(l.protein || 0)} g protein${l.voided ? " (VOIDED — excluded from grading)" : ""}`);
  }

  // ---- weigh-ins
  const wis = [...data.weighIns].filter((x) => x.date && typeof x.weight === "number").sort((a, b2) => b2.date.localeCompare(a.date)).slice(0, 10);
  lines.push("", "WEIGH-INS (newest first)", ...(wis.length ? wis.map((x) => `- ${x.date}: ${w(x.weight)}`) : ["- none yet"]));

  // ---- training
  const since = format(subDays(now, 13), "yyyy-MM-dd");
  const sessions = data.sessionCompletions.filter((s) => (s.date || "") >= since);
  const workouts = data.workoutLogs.filter((s) => (s.date || "") >= since);
  lines.push(
    "",
    "TRAINING — last 14 days",
    ...(sessions.length ? sessions.map((s) => `- ${s.date}: completed ${s.session_name || "session"}${s.travel ? " (travel)" : ""}`) : ["- no completed split sessions"]),
    ...workouts.map((s) => `- ${s.date}: ${s.session_name || "workout"} — ${s.status || "logged"}${s.mode ? ` (${s.mode})` : ""}`)
  );

  // ---- habits
  const habits = (profile.habits || []).filter(Boolean);
  if (habits.length) {
    lines.push("", "HABITS — last 14 days (✓ done, · not checked)");
    const done = new Set(data.habitLogs.filter((h) => h.done).map((h) => `${h.habit_name}|${h.date}`));
    for (const h of habits) {
      let row = "";
      let n = 0;
      for (let i = 13; i >= 0; i--) {
        const d = format(subDays(now, i), "yyyy-MM-dd");
        const hit = done.has(`${h}|${d}`);
        row += hit ? "✓" : "·";
        if (hit) n++;
      }
      lines.push(`- ${h}: ${row} (${n}/14, oldest → today)`);
    }
  }

  // ---- graded weeks
  const weeks = [...data.weeklySummaries].sort((a, b2) => (b2.week_start || "").localeCompare(a.week_start || "")).slice(0, 8);
  lines.push(
    "",
    "WINNING WEEK — graded weeks (newest first)",
    ...(weeks.length
      ? weeks.map(
          (x) =>
            `- week of ${x.week_start}: ${x.warmup ? "warm-up (not graded)" : x.won ? "WON" : "not won"} · nutrition ${x.nutrition_won ? "won" : "no"}, workouts ${x.workouts_won ? "won" : "no"}, habits ${x.habits_won ? "won" : "no"} · tracked ${x.tracked_days ?? "?"} days, avg ${x.avg_calories ?? "—"} kcal / ${x.avg_protein ?? "—"} g`
        )
      : ["- no graded weeks yet"])
  );

  // ---- maintenance history
  const hist = [...data.history].sort((a, b2) => (b2.date || "").localeCompare(a.date || "")).slice(0, 5);
  if (hist.length) lines.push("", "MAINTENANCE REFINEMENTS (newest first)", ...hist.map((h) => `- ${h.date}: ${Math.round(h.value)} kcal (${h.source})`));

  return lines.join("\n");
}
