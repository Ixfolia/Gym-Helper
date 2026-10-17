import React, { useState } from "react";
import { db } from "@/api/db";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { computeDailyTarget } from "@/lib/winningWeek";
import { defaultSchedule } from "@/lib/splits";

const EXPLAINER = "Same weekly average. Smarter distribution — fuel on the days you train.";

export default function PeriodizationSettings({ profile, onSaved }) {
  const [enabled, setEnabled] = useState(!!profile?.periodization_enabled);
  const [flex, setFlex] = useState(profile?.periodization_flex ?? 150);
  const [saving, setSaving] = useState(false);

  const schedule =
    profile?.week_schedule && profile.week_schedule.length === 7
      ? profile.week_schedule
      : defaultSchedule(profile?.cadence);
  const td = schedule.filter((k) => k !== "rest").length;
  const rd = 7 - td;

  const preview = computeDailyTarget({ ...profile, periodization_enabled: true, periodization_flex: flex }, []);
  const today = preview.isTraining
    ? `Today (training): ${preview.target.toLocaleString()} cal`
    : `Today (rest): ${preview.target.toLocaleString()} cal`;

  async function persist(next) {
    setSaving(true);
    try {
      await db.entities.Profile.update(profile.id, next);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }

  function toggle(v) {
    setEnabled(v);
    persist({ periodization_enabled: v });
  }

  function changeFlex(v) {
    setFlex(v[0]);
    persist({ periodization_flex: v[0] });
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Periodization mode</p>
          <p className="mt-2 text-sm font-light leading-relaxed text-foreground/60">{EXPLAINER}</p>
        </div>
        <Switch checked={enabled} onCheckedChange={toggle} disabled={saving} />
      </div>

      {enabled && (
        <div className="mt-5">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-foreground/40">
            <span>Daily flex</span>
            <span className="font-mono text-foreground/70">±{flex} cal</span>
          </div>
          <div className="mt-3 px-1">
            <Slider value={[flex]} min={0} max={500} step={25} onValueChange={changeFlex} disabled={saving} />
          </div>
          <div className="mt-2 flex justify-between text-[9px] tracking-wide text-foreground/30">
            <span>0</span>
            <span className="text-accent/60">±150 default</span>
            <span>500</span>
          </div>
          <p className="mt-4 text-xs font-light leading-relaxed text-foreground/50">
            Training days run <span className="text-accent">+{flex}</span>, rest days{" "}
            <span className="text-accent">−{flex}</span>. Across your {td} training / {rd} rest days
            the weekly average stays exactly on target.
          </p>
          <p className="mt-3 text-[11px] font-light text-accent/70">{today}</p>
        </div>
      )}
    </div>
  );
}