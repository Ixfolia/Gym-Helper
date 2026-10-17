import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { db } from "@/api/db";
import ScreenShell from "@/components/ScreenShell";
import StepDetail from "@/components/journey/StepDetail";
import AscentStep from "@/components/journey/AscentStep";
import { JOURNEY } from "@/lib/journey";
import {
  evaluateAll,
  stepsToComplete,
  stepProgress,
  phaseFraction,
  derivePhaseStep,
  isStepDone,
  dedupeJourneyProgress,
} from "@/lib/journeyEngine";
import { Check, Trophy, ChevronUp } from "lucide-react";

const todayStr = () => new Date().toISOString().slice(0, 10);

const ELEVATION = { 1: "Base Camp", 2: "The Ridge", 3: "The Crux", 4: "The Summit" };

export default function Journey() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    (async () => {
      const [profiles, dailyLogs, weighIns, workoutLogs, sessionCompletions, habitLogs, history, weeklySummaries, journeyRows, progressPhotos] =
        await Promise.all([
          db.entities.Profile.list(),
          db.entities.DailyLog.list("-date", 200),
          db.entities.WeighIn.list("-date", 100),
          db.entities.WorkoutLog.list("-date", 200),
          db.entities.SessionCompletion.list("-date", 200),
          db.entities.HabitLog.list("-date", 600),
          db.entities.MaintenanceHistory.list("-date", 50),
          db.entities.WeeklySummary.list("-date", 50),
          db.entities.JourneyProgress.list(),
          db.entities.ProgressPhoto.list("-date", 20),
        ]);

      // Dedupe: if more than one JourneyProgress row exists for a step, the
      // latest updated_date wins (deterministic). Superseded duplicates are
      // deleted below so the data stays clean going forward.
      const { byStep: map, duplicates } = dedupeJourneyProgress(journeyRows);
      setProgress(map);

      const ctx = {
        profile: profiles[0] || null,
        logs: dailyLogs,
        weighIns,
        workoutLogs,
        sessionCompletions,
        habitLogs,
        history,
        weeklySummaries,
        progressPhotos,
      };
      const evalMap = evaluateAll(ctx);
      const toComplete = stepsToComplete(evalMap, map);

      if (toComplete.length) {
        const today = todayStr();
        const updated = { ...map };
        for (const id of toComplete) {
          const rec = map[id];
          if (rec) {
            const u = await db.entities.JourneyProgress.update(rec.id, {
              status: "done",
              completed_date: today,
            });
            updated[id] = u;
          } else {
            const c = await db.entities.JourneyProgress.create({
              step: id,
              status: "done",
              completed_date: today,
            });
            updated[id] = c;
          }
        }
        setProgress(updated);
      }

      if (duplicates.length) {
        Promise.all(duplicates.map((d) => db.entities.JourneyProgress.delete(d.id))).catch(() => {});
      }

      setData(ctx);
      setLoading(false);
    })();
  }, []);

  const ordered = useMemo(() => JOURNEY.flatMap((p) => p.steps), []);
  const evalMap = useMemo(() => (data ? evaluateAll(data) : {}), [data]);
  const derived = useMemo(() => derivePhaseStep(evalMap, progress), [evalMap, progress]);

  const progressMap = useMemo(() => {
    if (!data) return {};
    const m = {};
    for (const s of ordered) m[s.id] = stepProgress(s.id, data);
    return m;
  }, [ordered, data]);

  // Persist the derived phase + step to the profile so anything that reads it
  // (including the journey_phase tag written on session completion) stays
  // correct. No local-state write here — avoids a recompute loop.
  useEffect(() => {
    const p = data?.profile;
    if (!p?.id) return;
    const stepId = derived.stepId || "";
    if (p.current_journey_phase !== derived.label || p.current_journey_step !== stepId) {
      db.entities.Profile.update(p.id, {
        current_journey_phase: derived.label,
        current_journey_step: stepId,
      }).catch(() => {});
    }
  }, [derived, data?.profile]);

  async function confirmManual(step) {
    const rec = progress[step.id];
    const wasDone = rec?.status === "done";
    const today = todayStr();
    const nextStatus = wasDone ? "pending" : "done";
    const nextDate = wasDone ? null : today;

    // Optimistic local update — the sheet flips to "Marked complete" at once.
    setProgress((p) => ({
      ...p,
      [step.id]: { ...(rec || { step: step.id }), status: nextStatus, completed_date: nextDate },
    }));

    try {
      if (rec) {
        const u = await db.entities.JourneyProgress.update(rec.id, {
          status: nextStatus,
          completed_date: nextDate,
        });
        setProgress((p) => ({ ...p, [step.id]: u }));
      } else {
        const c = await db.entities.JourneyProgress.create({
          step: step.id,
          status: nextStatus,
          completed_date: today,
        });
        setProgress((p) => ({ ...p, [step.id]: c }));
      }
    } catch {
      // Revert on failure.
      setProgress((p) => ({ ...p, [step.id]: rec || null }));
    }
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const allDone = derived.allDone;

  function stepStatus(stepId) {
    return isStepDone(stepId, progress, evalMap)
      ? "done"
      : stepId === derived.stepId
      ? "active"
      : "pending";
  }

  return (
    <ScreenShell eyebrow="Journey">
      {/* mountain silhouette */}
      <img
        src="https://media.base44.com/images/public/6a6b54647f3ea8aab4cd0d06/83b699302_001B-ascent-mountain-range.png"
        alt="The Aesthetic Ascent — mountain range"
        className="mx-auto mt-6 block w-full max-w-[960px] object-contain"
      />

      <p className="mt-3 text-sm font-light leading-relaxed text-foreground/40">
        Nineteen steps up the mountain. Most complete themselves as you live the system — every bar
        fills with each log, each session, each habit. A few you work through with AM Coach AI.
      </p>

      {allDone && (
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/[0.05] px-5 py-4">
          <Trophy className="h-5 w-5 text-accent" strokeWidth={1.5} />
          <p className="text-sm font-light text-foreground/70">You've reached the summit. An Aesthetic Master.</p>
        </div>
      )}

      <div className="mt-4 space-y-12">
        {JOURNEY.map((phase, pi) => {
          const phaseDone = phase.steps.every((s) => isStepDone(s.id, progress, evalMap));
          const phasePct = Math.round(
            phaseFraction(
              phase.steps.map((s) => ({
                progress: progressMap[s.id],
                done: isStepDone(s.id, progress, evalMap),
              }))
            ) * 100
          );
          return (
            <div key={phase.phase}>
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-[11px] text-accent/70">
                  {String(phase.phase).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">
                    {ELEVATION[phase.phase] || `Phase ${phase.phase}`}
                  </p>
                  <h2 className="font-display text-lg font-light tracking-tight text-foreground">
                    {phase.name}
                  </h2>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="font-mono text-[11px] text-accent/70">{phasePct}%</span>
                  {phaseDone && (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-accent">
                      <Check className="h-3 w-3" strokeWidth={2.5} /> Complete
                    </span>
                  )}
                </div>
              </div>

              <div className="relative mt-4">
                <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gradient-to-t from-accent/50 to-accent/10" />
                <div className="space-y-1">
                  {phase.steps.map((step) => {
                    const isCurrent = step.id === derived.stepId;
                    const status = stepStatus(step.id);
                    return (
                      <AscentStep
                        key={step.id}
                        step={step}
                        status={status}
                        isCurrent={isCurrent}
                        progress={progressMap[step.id]}
                        onClick={() =>
                          step.id === "p3-5"
                            ? navigate("/gate")
                            : setActive({ step, phase, isCurrent })
                        }
                      />
                    );
                  })}
                </div>
              </div>

              {pi < JOURNEY.length - 1 && (
                <div className="mt-3 flex justify-center">
                  <ChevronUp className="h-4 w-4 text-accent/30" strokeWidth={1.5} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {active && (
          <StepDetail
            step={active.step}
            phaseName={active.phase.name}
            phaseIndex={active.phase.phase}
            progress={progress}
            evalMap={evalMap}
            isCurrent={active.isCurrent}
            onClose={() => setActive(null)}
            onConfirm={() => confirmManual(active.step)}
          />
        )}
      </AnimatePresence>

    </ScreenShell>
  );
}