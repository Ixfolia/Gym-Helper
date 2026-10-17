// The Winning Week — calendar weeks (Monday–Sunday).
// The member's first tracked day starts their history. A partial first week is
// a WARM-UP (shown, never graded). After the first two full weeks ("show-up",
// Stage 0) the stage follows the journey phase. Weigh-ins only feed the weight
// trend; the weigh-in-to-weigh-in period logic is retired. Grades are persisted
// once to WeeklySummary (grade once, keep forever); streaks read persisted rows
// plus the live in-progress week.
import { differenceInCalendarDays, format, addDays } from "date-fns";
import { computeBaseline, computePace, parseTimeframe, currentMaintenance } from "./metabolism";
import { defaultSchedule } from "./splits";
import { completedSessions } from "./sessionCompletion";
import { JOURNEY, flattenSteps } from "./journey";
import { dedupeByDate, dedupeByWeekStart } from "./dedupe";

export const REVIEW_OPTIONS = [
  { key: "weekly", label: "Weekly", weeks: 1 },
  { key: "biweekly", label: "Bi-weekly", weeks: 2 },
  { key: "monthly", label: "Monthly", weeks: 4 },
];

export function winningConfig(profile) {
  return {
    zone: profile.win_zone ?? 100,
    cadence: profile.review_cadence || "weekly",
    periodWeeks: 1,
  };
}

export function computeTarget(profile, history) {
  const b = computeBaseline(profile);
  const weeks = parseTimeframe(profile.goal_timeframe);
  const maintenance = currentMaintenance(profile, history).value;
  const pace = computePace(maintenance, b.goalType, b.goalAmount, weeks, profile.sex);
  const target = pace.maintain
    ? maintenance
    : Number.isFinite(profile.custom_target)
    ? profile.custom_target
    : pace.targetIntake;
  const proteinCap = Math.floor((0.07 * target) / 5) * 5;
  const protein = Math.min(b.protein, proteinCap);
  return { maintenance, target, protein };
}

// Today's calorie target. When periodization is ON, the daily target flexes:
// training days run +flex, rest days -flex, around a recentered base so the
// WEEKLY AVERAGE of the daily targets stays exactly equal to the flat target.
export function computeDailyTarget(profile, history, date = new Date()) {
  const base = computeTarget(profile, history);
  const flat = {
    maintenance: base.maintenance,
    target: base.target,
    protein: base.protein,
    weeklyAverage: base.target,
    periodized: false,
  };
  if (!profile || !profile.periodization_enabled) return flat;
  const flex = profile.periodization_flex ?? 150;
  const schedule =
    profile.week_schedule && profile.week_schedule.length === 7
      ? profile.week_schedule
      : defaultSchedule(profile.cadence);
  const td = schedule.filter((k) => k !== "rest").length;
  const rd = 7 - td;
  if (!td || !rd) return flat;
  const idx = (date.getDay() + 6) % 7;
  const isTraining = schedule[idx] !== "rest";
  const center = base.target - (flex * (td - rd)) / 7;
  const daily = Math.round(center + (isTraining ? flex : -flex));
  return {
    maintenance: base.maintenance,
    target: daily,
    protein: base.protein,
    weeklyAverage: base.target,
    periodized: true,
    isTraining,
    flex,
    trainingDays: td,
    restDays: rd,
  };
}

// ---------------- Calendar-week Winning Week (v2) ----------------
const LBS_PER_KG = 2.20462;

function dateAt(d) {
  return new Date(d + "T12:00:00");
}
function addDaysStr(ds, n) {
  return format(addDays(dateAt(ds), n), "yyyy-MM-dd");
}
function dowMon0(ds) {
  return (dateAt(ds).getDay() + 6) % 7; // Mon=0..Sun=6
}
function mondayOf(ds) {
  const d = dateAt(ds);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return format(d, "yyyy-MM-dd");
}

// The Monday that starts the calendar week containing `ds`. Exported so the
// Fuel data path can delete a week's WeeklySummary row when a past day is edited.
export function weekStartOfDate(ds) {
  return mondayOf(ds);
}

// Phase number AS OF a given date, derived from JourneyProgress done records
// dated on or before that date — the phase implied by which steps were done by
// then (the first ordered step not done-as-of). Falls back to the profile's
// current phase field only when no done records carry a completed_date, so a
// past week is never graded against the current phase.
function phaseNumberAsOf(journeyProgress, asOfDateStr, profile) {
  const rows = journeyProgress || [];
  const dated = rows.filter((r) => r && r.status === "done" && r.completed_date);
  if (!dated.length) return journeyPhaseNumber(profile);
  const doneSteps = new Set(
    dated.filter((r) => r.completed_date <= asOfDateStr).map((r) => r.step)
  );
  const steps = flattenSteps();
  const next = steps.find((s) => !doneSteps.has(s.id));
  if (!next) return JOURNEY[JOURNEY.length - 1].phase;
  const ph = JOURNEY.find((p) => p.steps.some((s) => s.id === next.id));
  return ph ? ph.phase : journeyPhaseNumber(profile);
}

// Maintenance calories as of a week's end: the latest MaintenanceHistory row
// dated on or before that week's end, else the computed baseline.
function maintenanceAsOf(history, weekEndStr, profile) {
  const rows = (history || [])
    .filter((h) => h && h.date && h.date <= weekEndStr)
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  if (!rows.length) return computeBaseline(profile).baseline;
  return rows[rows.length - 1].value;
}

// Target/protein for grading a week, using the maintenance as of that week's
// end plus the current goal/schedule (custom_target, if set, overrides the
// pace target — and is reset only when the goal changes, per guard H).
function computeTargetAsOf(profile, maintenance) {
  const b = computeBaseline(profile);
  const weeks = parseTimeframe(profile.goal_timeframe);
  const pace = computePace(maintenance, b.goalType, b.goalAmount, weeks, profile.sex);
  const target = pace.maintain
    ? maintenance
    : Number.isFinite(profile.custom_target)
    ? profile.custom_target
    : pace.targetIntake;
  const proteinCap = Math.floor((0.07 * target) / 5) * 5;
  const protein = Math.min(b.protein, proteinCap);
  return { maintenance, target, protein };
}

// A completed week is provisional (regrade-on-load) when it ended within the
// last ~48h — i.e. today is Monday or Tuesday after the Sunday it ended.
function isProvisionalWeek(weekEnd, todayStr) {
  return differenceInCalendarDays(dateAt(todayStr), dateAt(weekEnd)) <= 2;
}
function weekLabel(w) {
  return `${format(dateAt(w.weekStart), "MMM d")} – ${format(dateAt(w.weekEnd), "MMM d")}`;
}

function journeyPhaseNumber(profile) {
  const m = String(profile?.current_journey_phase || "").match(/Phase\s+(\d+)/i);
  return m ? Number(m[1]) : 1;
}
function stageFromPhase(phaseNum) {
  if (phaseNum <= 1) return "S1";
  if (phaseNum === 2) return "S2";
  return "S3"; // Phase 3 or 4
}
function baseMinForStage(stage) {
  // S0 and S1 require 5 tracked days; S2 and S3 require 6.
  return stage === "S2" || stage === "S3" ? 6 : 5;
}
function proteinReq(stage, goal) {
  if (goal === "lose") return stage === "S1" ? 0.4 : stage === "S2" ? 0.5 : 0.6;
  if (goal === "gain") return stage === "S1" ? 0.7 : stage === "S2" ? 0.9 : 1.0;
  return stage === "S1" ? 0.4 : stage === "S2" ? 0.5 : 0.6; // maintain
}
function calRuleText(stage, goal) {
  if (goal === "lose")
    return stage === "S1" ? "≤ MAINT+200" : stage === "S2" ? "UNDER MAINT" : "≤ TARGET";
  if (goal === "gain")
    return stage === "S1" ? "MAINT±1000" : stage === "S2" ? "MAINT±500" : "MAINT→TARGET+100";
  return stage === "S1" ? "WITHIN 300" : stage === "S2" ? "WITHIN 200" : "WITHIN 150";
}
export function stageRuleText(stage, goal, minTracked) {
  if (!stage) return "WARM-UP";
  if (stage === "S0") return `WEEKS 1–2 · SHOW UP · ${minTracked} DAYS`;
  const phase = stage === "S1" ? "PHASE 1" : stage === "S2" ? "PHASE 2" : "PHASE 3";
  return `${phase} · ${calRuleText(stage, goal)} · ${proteinReq(stage, goal)} G/LB · ${minTracked} DAYS`;
}

function nutritionWin(o) {
  if (o.travelWeek) return travelNutritionWin(o);
  const { stage, goal, tracked, avg, proteinPerLb, maint, target, minTracked } = o;
  if (avg === null || tracked === 0 || proteinPerLb === null) return false;
  if (stage === "S0") return tracked >= minTracked;
  if (goal === "lose") {
    if (stage === "S1") return tracked >= minTracked && avg <= maint + 200 && proteinPerLb >= 0.4;
    if (stage === "S2") return tracked >= minTracked && avg < maint && proteinPerLb >= 0.5;
    return tracked >= minTracked && avg <= target && proteinPerLb >= 0.6; // S3
  }
  if (goal === "gain") {
    if (stage === "S1")
      return tracked >= minTracked && avg >= maint - 1000 && avg <= maint + 1000 && proteinPerLb >= 0.7;
    if (stage === "S2")
      return tracked >= minTracked && avg >= maint - 500 && avg <= maint + 500 && proteinPerLb >= 0.9;
    return tracked >= minTracked && avg >= maint && avg <= target + 100 && proteinPerLb >= 1.0; // S3
  }
  // maintain
  if (stage === "S1") return tracked >= minTracked && Math.abs(avg - maint) <= 300 && proteinPerLb >= 0.4;
  if (stage === "S2") return tracked >= minTracked && Math.abs(avg - maint) <= 200 && proteinPerLb >= 0.5;
  return tracked >= minTracked && Math.abs(avg - maint) <= 150 && proteinPerLb >= 0.6; // S3
}

// Travel weeks keep the existing travel nutrition rule exactly, overriding the
// goal/stage table: a relaxed one-sided maintenance±zone calorie band plus a
// protein-days floor (max 3, 60% of the week's days).
function travelNutritionWin(o) {
  if (o.avg === null) return false;
  let caloriePass = false;
  if (o.goal === "lose") caloriePass = o.avg <= o.maint + o.zone;
  else if (o.goal === "gain") caloriePass = o.avg >= o.maint - o.zone;
  else caloriePass = Math.abs(o.avg - o.target) <= o.zone;
  const proteinRequired = Math.max(3, Math.floor(0.6 * o.weekDays));
  return caloriePass && o.proteinDaysOn >= proteinRequired;
}

function workoutsWin(stage, completedCount, scheduled) {
  if (stage === "S0") return completedCount >= 2;
  return completedCount >= Math.max(2, scheduled - 1);
}
function habitsWin(stage, habitPct) {
  if (stage === "S0") return habitPct > 0;
  if (stage === "S1") return habitPct >= 0.5;
  if (stage === "S2") return habitPct >= 0.6;
  return habitPct >= 0.7; // S3
}
function overallWin(stage, n, w, h, habitsApplicable) {
  if (!n) return false; // nutrition is mandatory, never loses to the flex pair
  if (stage === "S3") {
    // With no habits configured, S3 is nutrition + workouts — not an unwinnable 0.
    return habitsApplicable ? w && h : w;
  }
  return w || h;
}

// Scheduled training days in [start, end] from week_schedule non-rest days, with
// the cadence fallback weekScore uses (4 on 4–6, 3 on 3–5), pro-rated by the
// number of days in the range.
function scheduledCount(profile, start, end) {
  const days = differenceInCalendarDays(dateAt(end), dateAt(start)) + 1;
  if (profile?.week_schedule && profile.week_schedule.length === 7) {
    let n = 0;
    for (let i = 0; i < days; i++) {
      const ds = addDaysStr(start, i);
      if (profile.week_schedule[dowMon0(ds)] !== "rest") n++;
    }
    return n;
  }
  const perWeek = profile?.cadence === "4-6" ? 4 : 3;
  return Math.max(1, Math.ceil((perWeek * days) / 7));
}

function buildWeeks(firstTrackedDate, todayStr) {
  if (!firstTrackedDate) return [];
  const firstMonday = mondayOf(firstTrackedDate);
  const weeks = [];
  let ws = firstMonday;
  let guard = 0;
  while (guard++ < 400) {
    const we = addDaysStr(ws, 6);
    const isCurrent = ws <= todayStr && todayStr <= we;
    const warmup = ws === firstMonday && firstTrackedDate > firstMonday;
    weeks.push({ weekStart: ws, weekEnd: we, warmup, isCurrent });
    if (isCurrent) break;
    ws = addDaysStr(ws, 7);
  }
  let fwi = -1;
  for (const w of weeks) {
    if (!w.warmup) fwi++;
    w.fullWeekIndex = w.warmup ? -1 : fwi;
  }
  return weeks;
}

function stageForWeek(w, profile, journeyProgress) {
  if (w.warmup) return null;
  if (w.fullWeekIndex < 2) return "S0";
  return stageFromPhase(phaseNumberAsOf(journeyProgress, w.weekEnd, profile));
}

// Reset Protocol: a week containing reset_date is graded only from reset_date
// to Sunday, with tracked-day minimums pro-rated (ceil(min × remainingDays ÷ 7),
// never below 2).
function effectiveStart(w, profile) {
  const rd = profile?.reset_date;
  if (rd && rd >= w.weekStart && rd <= w.weekEnd) return rd;
  return w.weekStart;
}

function trackedLogsInRange(logs, start, end) {
  return (logs || []).filter(
    (l) =>
      l.date >= start &&
      l.date <= end &&
      typeof l.calories === "number" &&
      l.calories > 0 &&
      !l.voided
  );
}

// Live grade fields for a completed week range [start, end] (end inclusive).
function computeWeekData(profile, logs, habitLogs, sessions, start, end, ctx) {
  const rangeLogs = trackedLogsInRange(logs, start, end);
  const tracked = rangeLogs.length;
  const avg = tracked ? Math.round(rangeLogs.reduce((s, l) => s + l.calories, 0) / tracked) : null;
  const avgProtein = tracked
    ? Math.round(rangeLogs.reduce((s, l) => s + (l.protein || 0), 0) / tracked)
    : null;
  const proteinPerLb = avgProtein !== null && ctx.bwLb ? avgProtein / ctx.bwLb : null;
  const proteinDaysOn = rangeLogs.filter((l) => (l.protein || 0) >= ctx.protein).length;
  const habits = (profile?.habits || []).filter((h) => h);
  const habitsApplicable = habits.length > 0;
  const days = differenceInCalendarDays(dateAt(end), dateAt(start)) + 1;
  const habitDone = (habitLogs || []).filter((h) => h.done && h.date >= start && h.date <= end).length;
  const habitPossible = habits.length * days;
  const habitPct = habitPossible > 0 ? habitDone / habitPossible : 0;
  const weekSessions = sessions.filter((s) => s.date >= start && s.date <= end);
  const completedCount = weekSessions.length;
  const travelWeek = weekSessions.some((s) => s.travel);
  const scheduled = scheduledCount(profile, start, end);
  return {
    tracked,
    avg,
    avgProtein,
    proteinPerLb,
    proteinDaysOn,
    habitPct,
    habitsApplicable,
    completedCount,
    travelWeek,
    scheduled,
    days,
  };
}

function rowFromPersisted(row, w, profile) {
  const habitsApplicable = (profile?.habits || []).filter((h) => h).length > 0;
  return {
    week_start: row.week_start,
    weekEnd: w.weekEnd,
    label: weekLabel(w),
    warmup: false,
    stage: row.stage || "S0",
    tracked: row.tracked_days ?? 0,
    avgCalories: row.avg_calories ?? null,
    avgProtein: row.avg_protein ?? null,
    proteinPerLb: null,
    habitPct: 0,
    habits_applicable: habitsApplicable,
    completedCount: 0,
    scheduled: 0,
    travelWeek: false,
    nutrition_won: !!row.nutrition_won,
    workouts_won: !!row.workouts_won,
    habits_won: !!row.habits_won,
    won: !!row.won,
    persisted: true,
    provisional: false,
  };
}

export function computeWinningWeeks(
  profile,
  logs,
  weighIns,
  habitLogs,
  workoutLogs,
  history,
  sessionCompletions,
  weeklySummaries,
  journeyProgress
) {
  const goal = profile?.goal || "maintain";
  const baseTarget = computeTarget(profile, history);
  const zone = profile.win_zone ?? 100;
  const sessions = completedSessions(workoutLogs, sessionCompletions);
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // DailyLog singularity — dedupe by date (most recently updated wins) so a
  // duplicate day row can never double-count in averages or tracked-day floors.
  const ddLogs = dedupeByDate(logs);

  const trackedDates = ddLogs
    .filter((l) => l.date && typeof l.calories === "number" && l.calories > 0 && !l.voided)
    .map((l) => l.date)
    .sort();
  const firstTrackedDate = trackedDates[0] || null;

  const latestWi = (weighIns || [])
    .filter((w) => w.date && typeof w.weight === "number")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-1)[0];
  const bwKg = latestWi ? latestWi.weight : profile?.current_weight;
  const bwLb = typeof bwKg === "number" ? bwKg * LBS_PER_KG : null;

  // WeeklySummary singularity — one row per week_start (most recently updated wins).
  const sumByStart = {};
  for (const r of dedupeByWeekStart(weeklySummaries)) sumByStart[r.week_start] = r;

  const weeks = buildWeeks(firstTrackedDate, todayStr);
  const periods = [];
  let current = null;

  for (const w of weeks) {
    if (w.isCurrent) {
      const start = effectiveStart(w, profile);
      const weekDays = differenceInCalendarDays(dateAt(w.weekEnd), dateAt(start)) + 1;
      const liveLogs = ddLogs.filter(
        (l) =>
          l.date >= start &&
          l.date < todayStr &&
          typeof l.calories === "number" &&
          l.calories > 0 &&
          !l.voided
      );
      const tracked = liveLogs.length;
      const avg = tracked ? Math.round(liveLogs.reduce((s, l) => s + l.calories, 0) / tracked) : null;
      const avgProtein = tracked
        ? Math.round(liveLogs.reduce((s, l) => s + (l.protein || 0), 0) / tracked)
        : null;
      const proteinPerLb = avgProtein !== null && bwLb ? avgProtein / bwLb : null;
      const proteinDaysOn = liveLogs.filter((l) => (l.protein || 0) >= baseTarget.protein).length;
      const habits = (profile?.habits || []).filter((h) => h);
      const habitsApplicable = habits.length > 0;
      const completedDays = Math.max(0, differenceInCalendarDays(dateAt(todayStr), dateAt(start)));
      const habitDone = (habitLogs || []).filter(
        (h) => h.done && h.date >= start && h.date < todayStr
      ).length;
      const habitPossible = habits.length * Math.max(1, completedDays);
      const habitPct = habitPossible > 0 ? habitDone / habitPossible : 0;
      const weekSessions = sessions.filter((s) => s.date >= start && s.date <= w.weekEnd);
      const completedCount = weekSessions.length;
      const travelWeek = weekSessions.some((s) => s.travel);
      const scheduled = scheduledCount(profile, start, w.weekEnd);
      const stage = stageForWeek(w, profile, journeyProgress);
      const baseMin = stage ? baseMinForStage(stage) : 5;
      const minTracked = Math.max(2, Math.ceil((baseMin * weekDays) / 7));
      const nutrition_won =
        !w.warmup &&
        nutritionWin({
          stage,
          goal,
          tracked,
          avg,
          proteinPerLb,
          maint: baseTarget.maintenance,
          target: baseTarget.target,
          protein: baseTarget.protein,
          proteinDaysOn,
          weekDays,
          zone,
          travelWeek,
          minTracked,
        });
      const workouts_won = !w.warmup && workoutsWin(stage, completedCount, scheduled);
      const habits_won = !w.warmup && habitsApplicable && habitsWin(stage, habitPct);
      const won = !w.warmup && overallWin(stage, nutrition_won, workouts_won, habits_won, habitsApplicable);
      current = {
        week_start: w.weekStart,
        weekEnd: w.weekEnd,
        label: weekLabel(w),
        warmup: w.warmup,
        stage,
        tracked,
        avgCalories: avg,
        avgProtein,
        proteinPerLb,
        habitPct,
        habits_applicable: habitsApplicable,
        completedCount,
        scheduled,
        travelWeek,
        minTracked,
        ruleText: w.warmup
          ? "WARM-UP"
          : travelWeek
          ? `TRAVEL · ${stageRuleText(stage, goal, minTracked)}`
          : stageRuleText(stage, goal, minTracked),
        inProgress: true,
        nutrition_won,
        workouts_won,
        habits_won,
        won,
        target: baseTarget.target,
        maintenance: baseTarget.maintenance,
        zone,
        protein: baseTarget.protein,
      };
    } else if (w.warmup) {
      periods.push({
        week_start: w.weekStart,
        weekEnd: w.weekEnd,
        label: weekLabel(w),
        warmup: true,
        stage: null,
        won: false,
        nutrition_won: false,
        workouts_won: false,
        habits_won: false,
        habits_applicable: (profile?.habits || []).filter((h) => h).length > 0,
        persisted: false,
        provisional: false,
        avgCalories: null,
        avgProtein: null,
        tracked: 0,
      });
    } else {
      const start = effectiveStart(w, profile);
      const end = w.weekEnd;
      const persistedRow = sumByStart[w.weekStart];
      const provisional = isProvisionalWeek(end, todayStr);
      // Provisional weeks (ended within ~48h) and any ungraded week are recomputed
      // fresh on load; older weeks with a persisted row stay frozen.
      if (persistedRow && !provisional) {
        periods.push(rowFromPersisted(persistedRow, w, profile));
      } else {
        const tAsOf = computeTargetAsOf(profile, maintenanceAsOf(history, end, profile));
        const ctx = { bwLb, protein: tAsOf.protein, target: tAsOf.target, maintenance: tAsOf.maintenance, zone, goal };
        const d = computeWeekData(profile, ddLogs, habitLogs, sessions, start, end, ctx);
        const stage = stageForWeek(w, profile, journeyProgress);
        const baseMin = baseMinForStage(stage);
        const minTracked = Math.max(2, Math.ceil((baseMin * d.days) / 7));
        const nutrition_won = nutritionWin({
          stage,
          goal,
          tracked: d.tracked,
          avg: d.avg,
          proteinPerLb: d.proteinPerLb,
          maint: tAsOf.maintenance,
          target: tAsOf.target,
          protein: tAsOf.protein,
          proteinDaysOn: d.proteinDaysOn,
          weekDays: d.days,
          zone,
          travelWeek: d.travelWeek,
          minTracked,
        });
        const workouts_won = workoutsWin(stage, d.completedCount, d.scheduled);
        const habits_won = d.habitsApplicable && habitsWin(stage, d.habitPct);
        const won = overallWin(stage, nutrition_won, workouts_won, habits_won, d.habitsApplicable);
        periods.push({
          week_start: w.weekStart,
          weekEnd: w.weekEnd,
          label: weekLabel(w),
          warmup: false,
          stage,
          tracked: d.tracked,
          avgCalories: d.avg,
          avgProtein: d.avgProtein,
          proteinPerLb: d.proteinPerLb,
          habitPct: d.habitPct,
          habits_applicable: d.habitsApplicable,
          completedCount: d.completedCount,
          scheduled: d.scheduled,
          travelWeek: d.travelWeek,
          nutrition_won,
          workouts_won,
          habits_won,
          won,
          persisted: false,
          provisional,
          target: tAsOf.target,
          maintenance: tAsOf.maintenance,
          zone,
          protein: tAsOf.protein,
        });
      }
    }
  }

  // Streaks — consecutive won weeks ending with the most recent completed
  // (non-warm-up) week. The in-progress week never counts.
  let streak = 0;
  let nutritionStreak = 0;
  for (let i = periods.length - 1; i >= 0; i--) {
    const p = periods[i];
    if (p.warmup) break;
    if (p.won) streak++;
    else break;
  }
  for (let i = periods.length - 1; i >= 0; i--) {
    const p = periods[i];
    if (p.warmup) break;
    if (p.nutrition_won) nutritionStreak++;
    else break;
  }

  const completedFullWeeks = periods.filter((p) => !p.warmup).length;
  const showUpEnded = completedFullWeeks >= 2;

  return {
    periods, // chronological (oldest first); UI reverses for display
    current,
    streak, // overall streak — Home Win the Week flame
    nutritionStreak, // Fuel WIN STREAK tile
    target: baseTarget.target,
    zone,
    protein: baseTarget.protein,
    maintenance: baseTarget.maintenance,
    hasWeighIns: !!firstTrackedDate, // scoreboard has started (kept name for Home)
    needMore: false,
    stage: current?.stage || null,
    showUpEnded,
  };
}