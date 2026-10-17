import React, { useContext, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { db } from "@/api/db";
import WizardShell from "@/components/fuel/WizardShell";
import BigChoice from "@/components/fuel/BigChoice";
import NumberField from "@/components/fuel/NumberField";
import HeightField from "@/components/fuel/HeightField";
import { kgToUnit, unitToKg, cmToFtIn, ftInToCm, unitLabel } from "@/lib/weightUnits";
import { goalConfirmation, deriveGoal, targetWeightKg, computeBaseline } from "@/lib/metabolism";
import { trackSwitchPayload } from "@/lib/splits";
import { useWeightUnit } from "@/lib/weightUnitContext";
import { WizardNavContext } from "@/lib/wizardNavContext";
import { Check } from "lucide-react";

const TOTAL = 7;

export const ACTIVITY = [
  { value: "sedentary", label: "Sedentary", desc: "Mostly sitting; little daily movement." },
  { value: "light", label: "Light", desc: "Some walking; on your feet part of the day." },
  { value: "moderate", label: "Moderate", desc: "Active through most of the day." },
  { value: "very_active", label: "Very active", desc: "Constant movement or physical work." },
];

export const DAYS = [
  { value: "mon", label: "Monday" },
  { value: "tue", label: "Tuesday" },
  { value: "wed", label: "Wednesday" },
  { value: "thu", label: "Thursday" },
  { value: "fri", label: "Friday" },
  { value: "sat", label: "Saturday" },
  { value: "sun", label: "Sunday" },
];

const GOALS = [
  { value: "lose", label: "Lose" },
  { value: "maintain", label: "Maintain" },
  { value: "gain", label: "Gain" },
];

export const TIMEFRAMES = ["1 month", "2 months", "3 months", "6+ months"];

export const LABELS = {
  male: "Male", female: "Female",
  sedentary: "Sedentary", light: "Light", moderate: "Moderate", very_active: "Very active",
  lose: "Lose", maintain: "Maintain", gain: "Gain",
  gain_w: "Gain weight", lose_w: "Lose weight", neither: "Neither",
  gained: "Gained", lost: "Lost", same: "Stayed about the same",
};

export default function FuelOnboarding({ existing, onSaved }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [a, setA] = useState(() => {
    const h = existing?.height != null ? cmToFtIn(existing.height) : { ft: null, in: null };
    return {
      sex: existing?.sex || null,
      age: existing?.age || null,
      heightFt: h.ft,
      heightIn: h.in,
      weightLbs: existing?.current_weight != null ? kgToUnit(existing.current_weight, "lbs") : null,
      activity_level: existing?.activity_level || null,
      cadence: existing?.cadence || "4-6",
      struggle: existing?.calibration_answers?.struggle || null,
      past_year: existing?.calibration_answers?.past_year || null,
      goalLbs: existing ? kgToUnit(targetWeightKg(existing), "lbs") : null,
      goal_timeframe: existing?.goal_timeframe || null,
      weigh_in_day: existing?.weigh_in_day || null,
    };
  });

  const set = (k, v) => setA((s) => ({ ...s, [k]: v }));
  const { unit } = useWeightUnit();
  const lbl = unitLabel(unit);
  const prevUnit = useRef(unit);

  // When the display unit toggles, convert the entered weight + goal values so
  // the numbers stay correct against the new label.
  useEffect(() => {
    if (prevUnit.current === unit) return;
    setA((s) => ({
      ...s,
      weightLbs: s.weightLbs != null ? kgToUnit(unitToKg(s.weightLbs, prevUnit.current), unit) : s.weightLbs,
      goalLbs: s.goalLbs != null ? kgToUnit(unitToKg(s.goalLbs, prevUnit.current), unit) : s.goalLbs,
    }));
    prevUnit.current = unit;
  }, [unit]);

  // While the wizard is mounted (first step through the "Start the journey"
  // screen), tell AppLayout to hide the bottom nav so no section shows active
  // mid-survey. It returns the moment we unmount onto the dashboard.
  const { setHideNav } = useContext(WizardNavContext);
  useEffect(() => {
    setHideNav(true);
    return () => setHideNav(false);
  }, [setHideNav]);

  const goalConfirm = a.weightLbs != null && a.goalLbs != null ? goalConfirmation(a.weightLbs, a.goalLbs, unit) : null;
  const goalSummary = goalConfirm
    ? goalConfirm.dir === "maintain"
      ? "Maintain"
      : `${LABELS[goalConfirm.dir]} ${goalConfirm.lbs} ${lbl}`
    : "—";

  const valid = {
    1: !!a.sex && !!a.age && (!!a.heightFt || !!a.heightIn) && !!a.weightLbs,
    2: !!a.activity_level,
    3: !!a.cadence,
    4: !!a.struggle && !!a.past_year,
    5: !!a.goalLbs && !!a.goal_timeframe,
    6: !!a.weigh_in_day,
    7: true,
  };

  async function save() {
    setSaving(true);
    setSaveError(null);
    const trackPayload = trackSwitchPayload(a.cadence);
    const payload = {
      ...trackPayload,
      sex: a.sex,
      age: a.age,
      height: ftInToCm(a.heightFt, a.heightIn),
      current_weight: unitToKg(a.weightLbs, unit),
      activity_level: a.activity_level,
      calibration_answers: { struggle: a.struggle, past_year: a.past_year },
      ...deriveGoal(unitToKg(a.weightLbs, unit), unitToKg(a.goalLbs, unit)),
      goal_timeframe: a.goal_timeframe,
      weigh_in_day: a.weigh_in_day,
    };
    // Persist the computed baseline so new members carry a metabolism_profile
    // going forward. Settings keeps computing live and doesn't touch this.
    const baseline = computeBaseline({ ...payload, cadence: a.cadence });
    payload.metabolism_profile = {
      maintenance: baseline.baseline,
      bmr: baseline.bmr,
      adjName: baseline.adjName,
      adjPct: baseline.adjPct,
      protein: baseline.protein,
    };
    let res;
    try {
      if (existing) {
        res = await db.entities.Profile.update(existing.id, payload);
      } else {
        res = await db.entities.Profile.create(payload);
      }
    } catch {
      setSaveError("Couldn't save your setup — check your connection and tap Confirm & save again.");
      setSaving(false);
      return;
    }
    // Verify the save by re-fetching the profile once before completing —
    // a failed write must never look like success.
    let verified;
    try {
      verified = await db.entities.Profile.get(res.id);
    } catch {
      verified = null;
    }
    if (!verified) {
      setSaveError("Couldn't save your setup — check your connection and tap Confirm & save again.");
      setSaving(false);
      return;
    }
    setSaving(false);
    setDone(verified);
  }

  if (done) {
    return (
      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 pb-32 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-accent/10 glow-md">
          <Check className="h-7 w-7 text-accent" strokeWidth={2} />
        </div>
        <h1 className="mt-7 font-display text-3xl font-light tracking-tight text-foreground">You're all set.</h1>
        <p className="mt-4 max-w-[16rem] text-sm font-light leading-relaxed text-foreground/45">
          Your baseline is locked in. The system meets you where you are.
        </p>
        <button
          onClick={() => onSaved(done)}
          className="mt-10 flex w-full items-center justify-center rounded-2xl bg-accent px-5 py-4 text-sm tracking-wide text-primary-foreground glow-sm"
        >
          Start the journey
        </button>
      </motion.main>
    );
  }

  return (
    <WizardShell
      step={step}
      total={TOTAL}
      title={
        {
          1: "Let's start with you.",
          2: "How do you move outside the gym?",
          3: "How will you train?",
          4: "A couple of calibration questions.",
          5: "What's the goal?",
          6: "Pick your weekly weigh-in day.",
          7: "Looks right?",
        }[step]
      }
      onBack={() => setStep((s) => Math.max(1, s - 1))}
      onNext={() => (step === TOTAL ? save() : setStep((s) => s + 1))}
      nextLabel={step === TOTAL ? "Confirm & save" : "Continue"}
      nextDisabled={!valid[step]}
      saving={saving}
    >
      {step === 1 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {["male", "female"].map((s) => (
              <BigChoice key={s} label={LABELS[s]} selected={a.sex === s} onClick={() => set("sex", s)} />
            ))}
          </div>
          <NumberField label="Age" value={a.age} onChange={(v) => set("age", v)} placeholder="—" unit="yrs" />
          <HeightField
            ft={a.heightFt}
            inches={a.heightIn}
            onChange={(ft, inches) => {
              set("heightFt", ft);
              set("heightIn", inches);
            }}
          />
          <NumberField label="Current weight" value={a.weightLbs} onChange={(v) => set("weightLbs", v)} placeholder="—" unit={lbl} />
        </>
      )}

      {step === 2 && (
        <div className="space-y-3">
          {ACTIVITY.map((o) => (
            <BigChoice
              key={o.value}
              label={o.label}
              description={o.desc}
              selected={a.activity_level === o.value}
              onClick={() => set("activity_level", o.value)}
            />
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <BigChoice
            label="4-6 days a week"
            description="The Peak path — the split the course is built on. Recommended."
            selected={a.cadence === "4-6"}
            onClick={() => set("cadence", "4-6")}
          />
          <BigChoice
            label="3-5 days a week"
            description="For packed schedules. You can switch anytime in Settings."
            selected={a.cadence === "3-5"}
            onClick={() => set("cadence", "3-5")}
          />
        </div>
      )}

      {step === 4 && (
        <>
          <p className="text-sm font-light leading-relaxed text-foreground/55">
            In general, do you struggle more to gain weight, lose weight, or neither?
          </p>
          <div className="space-y-3">
            {[
              { value: "lose_w", label: "Lose weight" },
              { value: "gain_w", label: "Gain weight" },
              { value: "neither", label: "Neither" },
            ].map((o) => (
              <BigChoice
                key={o.value}
                label={o.label}
                selected={a.struggle === o.value}
                onClick={() => set("struggle", o.value)}
              />
            ))}
          </div>
          <div className="pt-4">
            <p className="text-sm font-light leading-relaxed text-foreground/55">
              Over the past year, have you gained weight, lost weight, or stayed about the same?
            </p>
            <div className="mt-3 space-y-3">
              {[
                { value: "gained", label: "Gained" },
                { value: "lost", label: "Lost" },
                { value: "same", label: "Stayed about the same" },
              ].map((o) => (
                <BigChoice
                  key={o.value}
                  label={o.label}
                  selected={a.past_year === o.value}
                  onClick={() => set("past_year", o.value)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {step === 5 && (
        <>
          <p className="text-sm font-light leading-relaxed text-foreground/55">What weight do you want to reach?</p>
          <NumberField
            label="Target weight"
            value={a.goalLbs}
            onChange={(v) => set("goalLbs", v)}
            placeholder="—"
            unit={lbl}
          />
          {goalConfirm && (
            <p className="mt-2 text-sm font-light leading-relaxed text-accent/80">{goalConfirm.text}</p>
          )}
          <p className="pt-4 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Rough timeframe</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {TIMEFRAMES.map((t) => (
              <BigChoice key={t} label={t} selected={a.goal_timeframe === t} onClick={() => set("goal_timeframe", t)} />
            ))}
          </div>
        </>
      )}

      {step === 6 && (
        <div className="space-y-3">
          {DAYS.map((d) => (
            <BigChoice key={d.value} label={d.label} selected={a.weigh_in_day === d.value} onClick={() => set("weigh_in_day", d.value)} />
          ))}
        </div>
      )}

      {step === 7 && (
        <div className="space-y-3">
          <Row label="Sex" value={LABELS[a.sex]} />
          <Row label="Age" value={`${a.age} yrs`} />
          <Row label="Height" value={a.heightFt != null ? `${a.heightFt} ft ${a.heightIn ?? 0} in` : "—"} />
          <Row label="Weight" value={a.weightLbs != null ? `${a.weightLbs} ${lbl}` : "—"} />
          <Row label="Activity" value={LABELS[a.activity_level]} />
          <Row label="Training" value={a.cadence === "4-6" ? "4-6 days a week" : "3-5 days a week"} />
          <Row label="Struggle" value={LABELS[a.struggle]} />
          <Row label="Past year" value={LABELS[a.past_year]} />
          <Row label="Goal" value={goalSummary} />
          <Row label="Timeframe" value={a.goal_timeframe} />
          <Row label="Weigh-in" value={DAYS.find((d) => d.value === a.weigh_in_day)?.label} />
          {saveError && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-light leading-relaxed text-amber-200/90">
              {saveError}
            </p>
          )}
        </div>
      )}
    </WizardShell>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
      <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/35">{label}</span>
      <span className="text-sm text-foreground/85">{value}</span>
    </div>
  );
}