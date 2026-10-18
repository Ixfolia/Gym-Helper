import React, { useState } from "react";
import { format } from "date-fns";
import { db } from "@/api/db";
import BigChoice from "@/components/fuel/BigChoice";
import { currentMaintenance, computeBaseline, computePace, parseTimeframe, targetWeightKg } from "@/lib/metabolism";
import { computeDailyTarget } from "@/lib/winningWeek";
import ProteinTargetSection from "@/components/settings/ProteinTargetSection";
import AdjustTargetSection from "@/components/home/AdjustTargetSection";
import { LABELS } from "@/components/fuel/FuelOnboarding";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Metabolism calibration — the two answers that shape the maintenance
// estimate. The live readout recomputes after every save from
// currentMaintenance(profile, history) + the metabolism profile name from
// computeBaseline; when a refinement has run, the "stays in charge" line shows.
const STRUGGLE = [
  { value: "lose_w", label: LABELS.lose_w },
  { value: "gain_w", label: LABELS.gain_w },
  { value: "neither", label: LABELS.neither },
];
const PAST_YEAR = [
  { value: "gained", label: LABELS.gained },
  { value: "lost", label: LABELS.lost },
  { value: "same", label: LABELS.same },
];

export default function MetabolismCalibrationCard({ profile, history, onSaved }) {
  const [struggle, setStruggle] = useState(profile?.calibration_answers?.struggle || null);
  const [pastYear, setPastYear] = useState(profile?.calibration_answers?.past_year || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Manual maintenance adjustment (two compact dialogs). Writes a
  // MaintenanceHistory record with source "manual" — never edits profile
  // fields — so currentMaintenance picks it up as the latest entry.
  const [manualOpen, setManualOpen] = useState(false);
  const [manualStep, setManualStep] = useState("talk"); // "talk" | "edit"
  const [manualValue, setManualValue] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const cm = currentMaintenance(profile, history);
  const base = computeBaseline(profile);
  const canSave = !!struggle && !!pastYear;

  // Current daily calorie target + coach-recommended delta for the shared
  // "Adjust target" section (same component the Trajectory card uses).
  const dailyTarget = computeDailyTarget(profile, history);
  const coachPace = computePace(
    dailyTarget.maintenance,
    profile.goal,
    profile.goal_amount || 0,
    parseTimeframe(profile.goal_timeframe),
    profile.sex
  );
  const coachRecDelta = coachPace.maintain ? 0 : coachPace.dailyDelta;

  // Manual bounds: within 25% of the baseline maintenance, never below the
  // sex floor (1,200 female / 1,500 male).
  const baseMaint = base.baseline;
  const floor = profile?.sex === "female" ? 1200 : 1500;
  const lower = Math.max(Math.round(baseMaint * 0.75), floor);
  const upper = Math.round(baseMaint * 1.25);
  const clampManual = (v) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(lower, Math.min(upper, n)) : lower;
  };
  const rawNum = Number(manualValue);
  const clampedNum = manualValue !== "" && Number.isFinite(rawNum) ? clampManual(rawNum) : cm.value;
  const targetForMaintenance = (maintenance) => {
    const weeks = parseTimeframe(profile.goal_timeframe);
    const pace = computePace(maintenance, base.goalType, base.goalAmount, weeks, profile.sex);
    return pace.maintain ? maintenance : Number.isFinite(profile.custom_target) ? profile.custom_target : pace.targetIntake;
  };
  const newTarget = targetForMaintenance(clampedNum);

  function openManual() {
    setManualValue(String(clampManual(cm.value)));
    setManualStep("talk");
    setManualOpen(true);
  }
  async function applyManual() {
    const v = clampManual(manualValue);
    const today = format(new Date(), "yyyy-MM-dd");
    await db.entities.MaintenanceHistory.create({ date: today, value: v, source: "manual" });
    setConfirmOpen(false);
    setManualOpen(false);
    setManualStep("talk");
    onSaved?.();
  }

  async function setCustomTarget(value) {
    const rounded = Math.round(value);
    const updated = await db.entities.Profile.update(profile.id, { custom_target: rounded });
    onSaved?.(updated);
  }

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const updated = await db.entities.Profile.update(profile.id, {
        calibration_answers: { struggle, past_year: pastYear },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      onSaved?.(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <p className="text-sm text-foreground">Metabolism Calibration</p>
      <p className="text-[11px] font-light text-foreground/45">These answers shape your maintenance estimate.</p>

      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Struggle</p>
      <div className="mt-2 space-y-3">
        {STRUGGLE.map((o) => (
          <BigChoice key={o.value} label={o.label} selected={struggle === o.value} onClick={() => setStruggle(o.value)} />
        ))}
      </div>

      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Past year</p>
      <div className="mt-2 space-y-3">
        {PAST_YEAR.map((o) => (
          <BigChoice key={o.value} label={o.label} selected={pastYear === o.value} onClick={() => setPastYear(o.value)} />
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
          MAINTENANCE · {cm.value.toLocaleString()} KCAL · {base.adjName}
        </p>
        {cm.source === "manual" ? (
          <p className="mt-1.5 text-[11px] font-light text-accent/75">Set with your coach.</p>
        ) : cm.source === "calculated" ? (
          <p className="mt-1.5 text-[11px] font-light text-accent/75">
            Refined from your weigh-ins — this number stays in charge.
          </p>
        ) : null}
      </div>

      <button
        onClick={openManual}
        className="mt-2 text-[11px] font-light text-foreground/50 underline-offset-4 transition-colors hover:text-accent hover:underline"
      >
        Adjust maintenance manually
      </button>

      {profile?.goal === "lose" && <ProteinTargetSection profile={profile} onSaved={onSaved} />}

      <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">Calorie target</p>
          <p className="font-mono text-[11px] text-foreground/55">
            {Math.round(dailyTarget.target).toLocaleString()} kcal/day
          </p>
        </div>
        <AdjustTargetSection
          maintenance={dailyTarget.maintenance}
          target={dailyTarget.target}
          goal={profile.goal}
          sex={profile.sex}
          goalWeightKg={targetWeightKg(profile)}
          currentWeightKg={profile.current_weight}
          coachRecDelta={coachRecDelta}
          onSetTarget={setCustomTarget}
        />
      </div>

      <button
        onClick={save}
        disabled={saving || !canSave}
        className="mt-5 w-full rounded-2xl bg-accent py-3.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40"
      >
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save calibration"}
      </button>

      {/* Dialog one — talk it through, then reveal the manual kcal field */}
      <Dialog open={manualOpen} onOpenChange={(o) => { setManualOpen(o); if (!o) setManualStep("talk"); }}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          {manualStep === "talk" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Talk it through first</DialogTitle>
                <DialogDescription className="text-[13px] font-light leading-relaxed text-foreground/60">
                  Your maintenance is the number everything else hangs on. Have a conversation with your AM Coach AI before changing it, and stay close to its recommendation.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setManualOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-white/[0.03]"
                >
                  Not now
                </button>
                <button
                  onClick={() => setManualStep("edit")}
                  className="flex-1 rounded-xl bg-accent py-2.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md"
                >
                  Continue
                </button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Adjust maintenance</DialogTitle>
              </DialogHeader>
              <div className="mt-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-foreground/40">
                  {lower.toLocaleString()}–{upper.toLocaleString()} kcal
                </p>
                <input
                  type="number"
                  inputMode="numeric"
                  value={manualValue}
                  min={lower}
                  max={upper}
                  onChange={(e) => setManualValue(e.target.value)}
                  onBlur={(e) => setManualValue(String(clampManual(e.target.value)))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-2xl font-display font-bold text-foreground outline-none focus:border-accent/50"
                />
                <p className="mt-2 text-[12px] font-light leading-relaxed text-foreground/55">
                  Target becomes <span className="text-accent">{newTarget.toLocaleString()}</span> kcal · projections and the win zone shift with it.
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setManualStep("talk")}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-white/[0.03]"
                >
                  Back
                </button>
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={!Number.isFinite(Number(manualValue))}
                  className="flex-1 rounded-xl bg-accent py-2.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog two — confirm apply */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Apply this maintenance?</DialogTitle>
            <DialogDescription className="text-[13px] font-light leading-relaxed text-foreground/60">
              Your daily target changes to {newTarget.toLocaleString()} kcal.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setConfirmOpen(false)}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-foreground/70 transition-colors hover:bg-white/[0.03]"
            >
              Cancel
            </button>
            <button
              onClick={applyManual}
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md"
            >
              Apply
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}