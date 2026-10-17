// Journey auto-completion engine — pure functions.
// Evaluates each step's real-data condition and decides whether it completes itself,
// needs a manual "I've done this" confirm, or is locked (the Gate).

import { currentMaintenance, trainingDaysFromCadence, computeBaseline } from "./metabolism";
import { defaultSchedule } from "./splits";
import { completedSessions } from "./sessionCompletion";
import { JOURNEY, flattenSteps } from "./journey";

// mode: "auto" (completes itself) | "manual" (manual confirm) | "flex" (auto if signal, else manual) | "gate"
export const STEP_RULES = {
  "p1-1": { mode: "auto", signal: "baseline", hint: "Completes when fuel onboarding is done and you've logged 7 days." },
  "p1-photo": { mode: "auto", signal: "baseline_photo", hint: "Completes when your first Mirror Check photo is saved." },
  "p1-2": { mode: "auto", signal: "split_test", hint: "Completes after 4 full training weeks — a week counts when you finish all your sessions. Missed weeks never reset your progress." },
  "p1-3": { mode: "auto", signal: "retarget_id", hint: "Completes when you've chosen lagging areas and logged a retargeting session." },
  "p1-4": { mode: "flex", signal: "first_scorecard", hint: "Review your first weekly scorecard in Fuel, then confirm here." },
  "p2-1": { mode: "flex", signal: "first_refinement", hint: "Completes when you run a refinement in Fuel or adjust your targets — or confirm here if your current targets already fit." },
  "p2-2": { mode: "flex", signal: "split_custom", hint: "Completes when you adjust your retargeting or weekly order — or confirm here if your setup already fits." },
  "p2-3": { mode: "manual", hint: "Work through this, then confirm it here." },
  "p2-4": { mode: "manual", hint: "Work through this, then confirm it here." },
  "p2-5": { mode: "auto", signal: "habits_30", hint: "Completes at a 30-day milestone on all three habits." },
  "p2-6": { mode: "manual", hint: "Work through this, then confirm it here." },
  "p3-1": { mode: "auto", signal: "dialed_in", hint: "Completes when your maintenance confidence reaches Dialed In." },
  "p3-2": { mode: "auto", signal: "habits_90", hint: "Completes at a 90-day milestone on all three habits." },
  "p3-3": { mode: "flex", signal: "travel", hint: "Completes when Travel Mode is first used — or confirm manually." },
  "p3-4": { mode: "manual", hint: "Work through this, then confirm it here." },
  "p3-5": { mode: "gate", hint: "The Gate — built separately. Stays locked until your first real transformation." },
  "p4-1": { mode: "manual", hint: "Work through this, then confirm it here." },
  "p4-2": { mode: "manual", hint: "Work through this, then confirm it here." },
  "p4-3": { mode: "manual", hint: "Work through this, then confirm it here." },
  "p4-4": { mode: "manual", hint: "The capstone. Work through it, then confirm it here." },
};

function distinctLoggedDays(logs) {
  const set = new Set();
  for (const l of logs || []) {
    if (l.date && typeof l.calories === "number" && l.calories > 0) set.add(l.date);
  }
  return set.size;
}

function habitDoneCount(habitLogs, name) {
  return (habitLogs || []).filter((h) => h.done && h.habit_name === name).length;
}

// Completed training sessions come from two sources: legacy WorkoutLog
// records (status "done") and the SessionCompletion records created by the
// Train screen's "Complete Session" button. We union both so the journey's
// workout signals hear every completed session — no new targets, just the
// existing ones fed by both data streams.
function completedSessionCount(workoutLogs, sessionCompletions) {
  const wl = (workoutLogs || []).filter((w) => w.status === "done").length;
  const sc = (sessionCompletions || []).length;
  return wl + sc;
}

function hasRetargetSession(workoutLogs, sessionCompletions) {
  return (
    (workoutLogs || []).some((w) => w.status === "done" && /retarget/i.test(w.session_name || "")) ||
    (sessionCompletions || []).some((s) => /retarget/i.test(s.session_name || ""))
  );
}

// A "completed training week" is a Monday-start calendar week (the same
// Mon=0..Sun=6 convention the training schedule uses) in which the member
// finished at least `threshold` workouts — 4 on the 4–6 track, 3 on the 3–5
// track. Partial weeks simply don't count; the bank only ever grows, missed
// weeks never reset it.
function weekKeyOf(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const dow = (d.getDay() + 6) % 7; // Mon=0 .. Sun=6
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
}

function bankedTrainingWeeks(workoutLogs, sessionCompletions, cadence) {
  const threshold = cadence === "4-6" ? 4 : 3;
  const perWeek = new Map();
  for (const s of completedSessions(workoutLogs, sessionCompletions)) {
    if (!s.date) continue;
    const k = weekKeyOf(s.date);
    perWeek.set(k, (perWeek.get(k) || 0) + 1);
  }
  let weeks = 0;
  for (const cnt of perWeek.values()) if (cnt >= threshold) weeks++;
  return { weeks, threshold, target: 4 };
}

// A profile has a computable baseline if a stored metabolism_profile exists, or
// the raw inputs (sex, age, height, current_weight) are present so
// computeBaseline can produce a maintenance value. The stored object is no
// longer required.
function hasBaseline(profile) {
  if (!profile) return false;
  if (profile.metabolism_profile) return true;
  const b = computeBaseline(profile)?.baseline;
  return typeof b === "number" && isFinite(b) && b > 0;
}

// custom_target only satisfies the first_refinement signal when it is a
// non-null, finite number greater than 0. Number(null) is 0, so a bare
// Number.isFinite check would auto-complete "Review & Adjust Calorie Targets"
// for brand-new accounts that have never set a target.
function customTargetSet(profile) {
  const v = profile?.custom_target;
  return v != null && Number.isFinite(Number(v)) && Number(v) > 0;
}

export function evaluateSignal(signal, ctx) {
  const { profile, logs, workoutLogs, sessionCompletions, habitLogs, history, weeklySummaries, progressPhotos } = ctx;
  switch (signal) {
    case "baseline":
      return distinctLoggedDays(logs) >= 7 && hasBaseline(profile);
    case "split_test": {
      const { weeks } = bankedTrainingWeeks(workoutLogs, sessionCompletions, profile?.cadence);
      return weeks >= 4;
    }
    case "baseline_photo":
      return (progressPhotos || []).some((p) => p && p.file_url);
    case "retarget_id":
      return (profile?.retarget_areas || []).length > 0 && hasRetargetSession(workoutLogs, sessionCompletions);
    case "first_scorecard":
      return (weeklySummaries || []).length > 0;
    case "first_refinement":
      return (
        (history || []).some((h) => h.source === "calculated" || h.source === "manual") ||
        customTargetSet(profile)
      );
    case "split_custom": {
      if (!profile?.cadence) return false;
      const def = defaultSchedule(profile.cadence);
      const sched = profile?.week_schedule;
      return Array.isArray(sched) && sched.length === 7 && sched.some((k, i) => k !== def[i]);
    }
    case "habits_30": {
      const habits = (profile?.habits || []).filter((h) => h);
      return habits.length > 0 && habits.every((h) => habitDoneCount(habitLogs, h) >= 30);
    }
    case "dialed_in":
      return currentMaintenance(profile, history).confidence === "Dialed In";
    case "habits_90": {
      const habits = (profile?.habits || []).filter((h) => h);
      return habits.length > 0 && habits.every((h) => habitDoneCount(habitLogs, h) >= 90);
    }
    case "travel":
      return !!profile?.travel_mode;
    default:
      return false;
  }
}

export function stepMode(stepId) {
  return STEP_RULES[stepId] || { mode: "manual" };
}

// Returns { autoDone, mode, hint } for a step.
export function evaluateStep(stepId, ctx) {
  const rule = STEP_RULES[stepId] || { mode: "manual" };
  let autoDone = false;
  if (rule.signal) autoDone = evaluateSignal(rule.signal, ctx);
  return { mode: rule.mode, autoDone, hint: rule.hint || "" };
}

// Map of stepId -> { autoDone, mode, hint } for the whole journey.
export function evaluateAll(ctx) {
  const out = {};
  for (const id of Object.keys(STEP_RULES)) out[id] = evaluateStep(id, ctx);
  return out;
}

// Deterministic dedupe for JourneyProgress rows: if more than one record exists
// for a step, the one with the latest updated_date wins (ties broken by id
// ascending for a stable order). Returns { byStep: {step -> winner},
// duplicates: [superseded rows] }. Journey builds its live progress map from
// `byStep` and deletes the `duplicates` so the data stays clean going forward;
// Home rebuilds from the same rows on its own load, so the cleaned data keeps
// the dashboard in sync with Journey.
export function dedupeJourneyProgress(rows) {
  const byStep = {};
  const duplicates = [];
  for (const r of rows) {
    const cur = byStep[r.step];
    if (!cur) {
      byStep[r.step] = r;
      continue;
    }
    const a = cur.updated_date || "";
    const b = r.updated_date || "";
    let winner;
    let loser;
    if (b > a) {
      winner = r;
      loser = cur;
    } else if (b < a) {
      winner = cur;
      loser = r;
    } else {
      winner = r.id < cur.id ? r : cur;
      loser = winner === r ? cur : r;
    }
    byStep[r.step] = winner;
    duplicates.push(loser);
  }
  return { byStep, duplicates };
}

// Which auto/flex steps should now be done that aren't stored-done yet.
export function stepsToComplete(evalMap, progress) {
  return Object.keys(evalMap).filter((id) => {
    const e = evalMap[id];
    if (e.mode === "gate") return false;
    if (e.mode === "manual") return false; // flex with autoDone true is completable
    const stored = progress[id];
    return e.autoDone && stored?.status !== "done";
  });
}

// Live progress toward each step's done-when condition — the bar that fills as
// real data accumulates. Returns { kind, current, target, label }.
//   kind "count"  -> numeric bar (current/target), ticks up with real logs.
//   kind "confirm"-> 0/1 manual step; fills when the user confirms manually.
//   kind "gate"   -> no bar; the Gate is unlocked on its own page.
export function stepProgress(stepId, ctx) {
  const { profile, logs, workoutLogs, sessionCompletions, habitLogs, history, weeklySummaries, progressPhotos } = ctx;
  const rule = STEP_RULES[stepId];
  if (!rule) return { kind: "confirm", current: 0, target: 1, label: "confirm manually" };
  if (rule.mode === "gate") return { kind: "gate" };

  const habitMin = () => {
    const habits = (profile?.habits || []).filter((h) => h);
    if (!habits.length) return 0;
    return Math.min(...habits.map((h) => habitDoneCount(habitLogs, h)));
  };

  switch (rule.signal) {
    case "baseline":
      return { kind: "count", current: distinctLoggedDays(logs), target: 7, label: "days logged" };
    case "split_test": {
      const { weeks, target } = bankedTrainingWeeks(workoutLogs, sessionCompletions, profile?.cadence);
      return { kind: "count", current: Math.min(weeks, target), target, label: "training weeks" };
    }
    case "baseline_photo":
      return {
        kind: "count",
        current: Math.min((progressPhotos || []).filter((p) => p && p.file_url).length, 1),
        target: 1,
        label: "photo",
      };
    case "retarget_id":
      return {
        kind: "count",
        current:
          ((profile?.retarget_areas || []).length ? 1 : 0) +
          (hasRetargetSession(workoutLogs, sessionCompletions) ? 1 : 0),
        target: 2,
        label: "done",
      };
    case "first_scorecard":
      return { kind: "count", current: (weeklySummaries || []).length, target: 1, label: "scorecard" };
    case "first_refinement": {
      const satisfied =
        (history || []).some((h) => h.source === "calculated" || h.source === "manual") ||
        customTargetSet(profile);
      return { kind: "count", current: satisfied ? 1 : 0, target: 1, label: "refinement saved" };
    }
    case "split_custom": {
      if (!profile?.cadence) return false;
      const def = defaultSchedule(profile.cadence);
      const sched = profile?.week_schedule;
      const diff = Array.isArray(sched) && sched.length === 7 ? sched.filter((k, i) => k !== def[i]).length : 0;
      return { kind: "count", current: Math.min(diff, 1), target: 1, label: "customization" };
    }
    case "habits_30":
      return { kind: "count", current: habitMin(), target: 30, label: "habit days" };
    case "dialed_in":
      return { kind: "count", current: (history || []).length, target: 3, label: "refinements" };
    case "habits_90":
      return { kind: "count", current: habitMin(), target: 90, label: "habit days" };
    case "travel":
      return { kind: "count", current: profile?.travel_mode ? 1 : 0, target: 1, label: "travel mode" };
    default:
      return { kind: "confirm", current: 0, target: 1, label: "confirm manually" };
  }
}

// Fractional progress for a single step (0–1). Measurable (count) steps
// contribute their current/target ratio; single-action / user-confirmed
// (confirm) and locked (gate) steps contribute 0 until done, then 1.
export function stepFraction(progress, done) {
  if (done) return 1;
  if (!progress) return 0;
  if (progress.kind === "gate") return 0;
  if (progress.kind === "count" && progress.target > 0) {
    return Math.max(0, Math.min(progress.current / progress.target, 1));
  }
  return 0;
}

// Phase fraction (0–1) = average of all step fractions.
// steps: [{ progress, done }] — progress is a stepProgress() result.
export function phaseFraction(steps) {
  if (!steps || !steps.length) return 0;
  return steps.reduce((sum, s) => sum + stepFraction(s.progress, s.done), 0) / steps.length;
}

// Is a single step done? A stored "done" record counts; a stored "pending"
// record does NOT. An auto/flex step (not gate/manual) whose real-data signal
// is satisfied counts as done even with no stored record — so undo can never
// un-complete real data. `progress` is a stepId -> record map; `evalMap` is
// evaluateAll(ctx).
export function isStepDone(id, progress, evalMap) {
  if (progress[id]?.status === "done") return true;
  const e = evalMap[id];
  return !!e && e.mode !== "gate" && e.mode !== "manual" && e.autoDone;
}

// Derive the active phase + step from eval + stored progress. The active phase
// is the phase of the first not-done ordered step (the same rule Home and
// Journey use); if every step is done, the final phase is returned at 100%.
// `label` is "Phase N · name" (the canonical form persisted to the profile and
// used by session completion's journey_phase tag).
export function derivePhaseStep(evalMap, progress) {
  const step = flattenSteps().find((s) => !isStepDone(s.id, progress, evalMap));
  if (!step) {
    const last = JOURNEY[JOURNEY.length - 1];
    return {
      phaseNumber: last.phase,
      phaseName: last.name,
      stepId: null,
      stepTitle: null,
      allDone: true,
      label: `Phase ${last.phase} · ${last.name}`,
    };
  }
  const phase = JOURNEY.find((ph) => ph.steps.some((s) => s.id === step.id));
  return {
    phaseNumber: phase.phase,
    phaseName: phase.name,
    stepId: step.id,
    stepTitle: step.title,
    allDone: false,
    label: `Phase ${phase.phase} · ${phase.name}`,
  };
}

// The just-completed phase that still needs a one-time celebration, or null.
// A phase is celebrated once when the member advances past it (phaseNumber - 1);
// `lastCelebrated` is the profile's last_celebrated_phase string.
export function completedPhaseToCelebrate(derived, lastCelebrated) {
  const seen = Number(lastCelebrated) || 0;
  // Final phase complete: celebrate the last phase too — the card celebration
  // plays, but Home suppresses the unlock dialog for the final phase so no
  // "next phase" is ever referenced.
  if (derived.allDone) {
    const last = JOURNEY[JOURNEY.length - 1].phase;
    return last > seen ? last : null;
  }
  const cp = derived.phaseNumber - 1;
  if (cp < 1) return null;
  return cp > seen ? cp : null;
}