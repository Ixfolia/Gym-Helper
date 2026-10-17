import { JOURNEY, flattenSteps } from "@/lib/journey";

// Snapshot of the member's current journey phase, derived from stored
// JourneyProgress done-records (the first ordered step that isn't done).
// Used when recording a session completion so the phase is captured at the
// moment of completion.
export function currentPhaseLabel(progressRows) {
  const done = new Set(
    (progressRows || []).filter((r) => r.status === "done").map((r) => r.step)
  );
  const step = flattenSteps().find((s) => !done.has(s.id));
  if (!step) {
    const last = JOURNEY[JOURNEY.length - 1];
    return `Phase ${last.phase} · ${last.name}`;
  }
  const phase = JOURNEY.find((ph) => ph.steps.some((s) => s.id === step.id));
  return `Phase ${phase.phase} · ${phase.name}`;
}

// Canonical merged list of completed sessions from BOTH sources — WorkoutLog
// records with status "done" and SessionCompletion records — normalized to
// { date, session_name, travel } and de-duplicated by date + session_name so a
// session recorded in both places counts once. This is the app's single
// definition of "a completed session"; every sessions count uses it.
export function completedSessions(workoutLogs, sessionCompletions) {
  const map = new Map();
  const add = (s) => {
    if (!s || !s.date) return;
    const key = `${s.date}::${s.session_name || ""}`;
    const existing = map.get(key);
    if (existing) {
      if (s.travel && !existing.travel) existing.travel = true;
    } else {
      map.set(key, { date: s.date, session_name: s.session_name || "", travel: !!s.travel });
    }
  };
  for (const w of workoutLogs || []) {
    if (w && w.status === "done") add(w);
  }
  for (const s of sessionCompletions || []) {
    add(s);
  }
  return Array.from(map.values());
}