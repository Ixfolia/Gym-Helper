import React, { useEffect, useRef, useState } from "react";
import { db } from "@/api/db";
import HeightField from "@/components/fuel/HeightField";
import NumberField from "@/components/fuel/NumberField";
import BigChoice from "@/components/fuel/BigChoice";
import WeightUnitToggle from "@/components/fuel/WeightUnitToggle";
import { ACTIVITY, DAYS, TIMEFRAMES } from "@/components/fuel/FuelOnboarding";
import { kgToUnit, unitToKg, cmToFtIn, ftInToCm, unitLabel } from "@/lib/weightUnits";
import { goalConfirmation, deriveGoal, targetWeightKg } from "@/lib/metabolism";
import { useWeightUnit } from "@/lib/weightUnitContext";

const LABELS = { male: "Male", female: "Female" };

// Profile & Goals editor — height (ft + in), age, sex, GOAL WEIGHT as a target
// bodyweight, plus activity level, goal timeframe, weigh-in day, and weight
// display unit. Saving derives `goal` + `goal_amount` (kg delta) from the
// target vs current weight, so every downstream calculation recomputes from
// the same stored fields. The unit toggle persists immediately via context.
export default function ProfileGoalsCard({ profile, onSaved }) {
  const h = profile?.height != null ? cmToFtIn(profile.height) : { ft: null, in: null };
  const [sex, setSex] = useState(profile?.sex || null);
  const [age, setAge] = useState(profile?.age || null);
  const [heightFt, setHeightFt] = useState(h.ft);
  const [heightIn, setHeightIn] = useState(h.in);
  const [goalLbs, setGoalLbs] = useState(profile ? kgToUnit(targetWeightKg(profile), "lbs") : null);
  const [activity, setActivity] = useState(profile?.activity_level || null);
  const [timeframe, setTimeframe] = useState(profile?.goal_timeframe || null);
  const [weighDay, setWeighDay] = useState(profile?.weigh_in_day || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState(null);
  const { unit, setUnit } = useWeightUnit();
  const lbl = unitLabel(unit);
  const prevUnit = useRef(unit);

  useEffect(() => {
    if (prevUnit.current === unit) return;
    setGoalLbs((cur) => {
      if (cur == null) return cur;
      return kgToUnit(unitToKg(cur, prevUnit.current), unit);
    });
    prevUnit.current = unit;
  }, [unit]);

  const curLbs = profile?.current_weight != null ? kgToUnit(profile.current_weight, unit) : null;
  const goalDisp = goalLbs;
  const gc = curLbs != null && goalDisp != null ? goalConfirmation(curLbs, goalDisp, unit) : null;

  const canSave = !!sex && !!age && (!!heightFt || !!heightIn) && goalLbs != null;

  async function save() {
    if (!canSave) return;
    setSaving(true);
    try {
      const { goal, goal_amount } = deriveGoal(profile?.current_weight, unitToKg(goalLbs, unit));
      const goalChanged = goal !== profile?.goal;
      const payload = {
        sex,
        age,
        height: ftInToCm(heightFt, heightIn),
        goal,
        goal_amount,
        activity_level: activity,
        goal_timeframe: timeframe,
        weigh_in_day: weighDay,
      };
      // A goal change invalidates the old custom target — clear it so the
      // Trajectory card falls back to the coach prescription until a new one is set.
      if (goalChanged) payload.custom_target = null;
      // Leaving weight loss invalidates the protein override — clear it so the
      // target falls back to the live formula for the new goal.
      if (goal !== "lose" && profile?.protein_override_g != null) payload.protein_override_g = null;
      const updated = await db.entities.Profile.update(profile.id, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      if (goalChanged) {
        setNotice("Goal changed — your custom target was reset. Set a new one from the Trajectory card.");
        setTimeout(() => setNotice(null), 5000);
      }
      onSaved?.(updated);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
      <p className="text-sm text-foreground">Profile & Goals</p>
      <p className="text-[11px] font-light text-foreground/45">
        Your baseline details and target bodyweight.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {["male", "female"].map((s) => (
          <BigChoice key={s} label={LABELS[s]} selected={sex === s} onClick={() => setSex(s)} />
        ))}
      </div>
      <div className="mt-3">
        <NumberField label="Age" value={age} onChange={setAge} placeholder="—" unit="yrs" />
      </div>
      <div className="mt-3">
        <HeightField
          ft={heightFt}
          inches={heightIn}
          onChange={(ft, inches) => {
            setHeightFt(ft);
            setHeightIn(inches);
          }}
        />
      </div>
      <div className="mt-3">
        <NumberField label="Goal weight" value={goalLbs} onChange={setGoalLbs} placeholder="—" unit={lbl} />
      </div>
      {gc && <p className="mt-2 text-sm font-light leading-relaxed text-accent/80">{gc.text}</p>}

      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Activity level</p>
      <div className="mt-2 space-y-3">
        {ACTIVITY.map((o) => (
          <BigChoice key={o.value} label={o.label} description={o.desc} selected={activity === o.value} onClick={() => setActivity(o.value)} />
        ))}
      </div>

      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Goal timeframe</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {TIMEFRAMES.map((t) => (
          <BigChoice key={t} label={t} selected={timeframe === t} onClick={() => setTimeframe(t)} />
        ))}
      </div>

      <p className="mt-5 text-[10px] uppercase tracking-[0.28em] text-foreground/35">Weigh-in day</p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {DAYS.map((d) => (
          <BigChoice key={d.value} label={d.label} selected={weighDay === d.value} onClick={() => setWeighDay(d.value)} />
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <span className="text-[10px] uppercase tracking-[0.28em] text-foreground/35">Weight display unit</span>
        <WeightUnitToggle unit={unit} onChange={setUnit} />
      </div>

      <button
        onClick={save}
        disabled={saving || !canSave}
        className="mt-5 w-full rounded-2xl bg-accent py-3.5 text-sm text-primary-foreground glow-sm transition-all hover:glow-md disabled:opacity-40"
      >
        {saved ? "Saved ✓" : saving ? "Saving…" : "Save profile & goals"}
      </button>
      {notice && (
        <p className="mt-3 text-sm font-light leading-relaxed text-accent/80">{notice}</p>
      )}
    </div>
  );
}