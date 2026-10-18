import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { goalPacing } from "@/lib/metabolism";
import NumberField from "@/components/fuel/NumberField";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Shared "Adjust target" flow — the recommended Sustainable Plan + guarded
// manual calorie entry. Used by both the Trajectory card (The Vision) and the
// Settings Metabolism Calibration card. Bounds come from the shared goal-pacing
// model; the manual path sits behind a coach-conversation prompt. The chosen
// target is written via onSetTarget (which persists custom_target). Renders
// nothing for maintain goals, exactly as the Trajectory card always has.
const WEEKS = 26;

export default function AdjustTargetSection({
  maintenance,
  target,
  goal,
  sex,
  goalWeightKg,
  currentWeightKg,
  coachRecDelta = 0,
  onSetTarget,
  // Optional controlled manual-entry state. The Trajectory card passes these so
  // its Vision chart can preview the projection against the in-progress manual
  // value; when omitted (e.g. Settings), the component manages its own state.
  manualOpen: manualOpenProp,
  setManualOpen: setManualOpenProp,
  manualTarget: manualTargetProp,
  setManualTarget: setManualTargetProp,
}) {
  const adjustable = goal === "lose" || goal === "gain";
  const goalAmountKg = Math.abs((goalWeightKg || 0) - (currentWeightKg || 0));
  const pacing = adjustable ? goalPacing(maintenance, goal, goalAmountKg, WEEKS, sex) : null;

  const controlled =
    manualOpenProp != null && setManualOpenProp != null && manualTargetProp != null && setManualTargetProp != null;
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalTarget, setInternalTarget] = useState(() => Math.round(target || 0));
  const [showCoachDialog, setShowCoachDialog] = useState(false);
  const manualOpen = controlled ? manualOpenProp : internalOpen;
  const setManualOpen = controlled ? setManualOpenProp : setInternalOpen;
  const manualTarget = controlled ? manualTargetProp : internalTarget;
  const setManualTarget = controlled ? setManualTargetProp : setInternalTarget;

  if (!adjustable || !pacing) return null;

  let mLo = 0;
  let mHi = 0;
  if (pacing) {
    if (goal === "lose") {
      mLo = Math.max(pacing.floor, (maintenance || 0) - pacing.hardMax);
      mHi = (maintenance || 0) - 100;
    } else if (goal === "gain") {
      mLo = (maintenance || 0) + 100;
      mHi = (maintenance || 0) + pacing.hardMax;
    }
  }
  const mVal = Number(manualTarget) || 0;
  const mInRange = mVal >= mLo && mVal <= mHi;
  const mNearest = mVal < mLo ? mLo : mVal > mHi ? mHi : mVal;

  const storedDelta = Math.abs((target || 0) - (maintenance || 0));
  const activeDelta = manualOpen ? Math.abs(mVal - (maintenance || 0)) : storedDelta;
  const movedFromRec = Math.round(activeDelta) !== Math.round(coachRecDelta);
  const onSustainablePlan = Math.round(target || 0) === pacing.recommendedTarget;

  const handleUsePlan = () => {
    if (!onSetTarget || !pacing) return;
    onSetTarget(pacing.recommendedTarget);
  };
  const handleContinueManual = () => {
    setShowCoachDialog(false);
    setManualTarget(Math.round(target || 0));
    setManualOpen(true);
  };
  const stepManual = (dir) => setManualTarget(Math.round((Number(manualTarget) || 0) + dir * 25));
  const handleApplyManual = () => {
    if (!onSetTarget || !mInRange) return;
    onSetTarget(Math.round(mVal));
    setManualOpen(false);
  };
  const handleCancelManual = () => {
    setManualTarget(Math.round(target || 0));
    setManualOpen(false);
  };

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-4">
      {!manualOpen ? (
        <>
          {/* PATH 1 — SUSTAINABLE PLAN */}
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">
              SUSTAINABLE PLAN · {goal === "lose" ? "−" : "+"}
              {pacing.recommendedDelta} KCAL/DAY → {pacing.recommendedTarget} KCAL
            </p>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">
              {pacing.realisticWeeks <= WEEKS
                ? `GOAL ≈ ${pacing.realisticDate}`
                : "SAFE MAX PACE · GOAL BEYOND 6 MONTHS"}
            </p>
            {onSustainablePlan ? (
              <p className="mt-3 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-accent/80">
                <Check className="h-3 w-3" strokeWidth={2.5} /> You're on the sustainable plan
              </p>
            ) : (
              onSetTarget && (
                <button
                  onClick={handleUsePlan}
                  className="mt-3 w-full rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-medium text-accent transition-all hover:bg-accent/20"
                >
                  Use this plan
                </button>
              )
            )}
          </div>

          {/* PATH 2 — SET MY OWN */}
          <div className="mt-4 border-t border-white/[0.06] pt-4">
            <button
              onClick={() => setShowCoachDialog(true)}
              className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/55 transition-colors hover:text-accent"
            >
              Set my own target
            </button>
          </div>
        </>
      ) : (
        /* PATH 2 — MANUAL PANEL */
        <div>
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">
              Set my own target
            </p>
            <button
              onClick={handleCancelManual}
              className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40 transition-colors hover:text-foreground/70"
            >
              Cancel
            </button>
          </div>
          <div className="mt-3">
            <NumberField
              label="Daily target"
              value={manualTarget}
              onChange={(v) => setManualTarget(v)}
              unit="kcal"
            />
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => stepManual(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] text-lg text-foreground/70 transition-colors hover:border-accent/40 hover:text-accent"
            >
              −
            </button>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/35">
              step 25 kcal
            </p>
            <button
              onClick={() => stepManual(1)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] text-lg text-foreground/70 transition-colors hover:border-accent/40 hover:text-accent"
            >
              +
            </button>
          </div>
          {!mInRange && (
            <p
              className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em]"
              style={{ color: "#F5A623" }}
            >
              Nearest allowed: {Math.round(mNearest)} kcal
            </p>
          )}
          {movedFromRec && (
            <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-foreground/40">
              COACH REC: {Math.round(coachRecDelta)}
            </p>
          )}
          <button
            onClick={handleApplyManual}
            disabled={!mInRange}
            className="mt-3 w-full rounded-xl border border-accent/40 bg-accent/10 px-4 py-2 text-xs font-medium text-accent transition-all hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      )}

      <Dialog open={showCoachDialog} onOpenChange={setShowCoachDialog}>
        <DialogContent className="rounded-2xl border border-white/[0.08] bg-card p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-light text-foreground">
              Talk it through first
            </DialogTitle>
            <DialogDescription className="text-sm font-light leading-relaxed text-foreground/55">
              Manual targets skip the guardrails. Have a quick conversation with your AM Coach AI before
              you change the number — it knows your goal, your timeline, and what's sustainable.{" "}
              <Link to="/coach" className="inline text-accent underline-offset-2 hover:underline">
                Open your coach →
              </Link>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <button
              onClick={() => setShowCoachDialog(false)}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs text-foreground/70 transition-colors hover:text-foreground"
            >
              Not now
            </button>
            <button
              onClick={handleContinueManual}
              className="rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-primary-foreground glow-sm transition-all hover:glow-md"
            >
              Continue to manual entry
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}