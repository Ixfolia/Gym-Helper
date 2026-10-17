import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "@/api/db";
import ScreenShell from "@/components/ScreenShell";
import { Slider } from "@/components/ui/slider";
import {
  parseTimeframe,
  currentMaintenance,
  goalPacing,
  paceAtDelta,
  labelForWeeks,
} from "@/lib/metabolism";
import { TrendingDown, TrendingUp } from "lucide-react";

export default function GoalPacing() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delta, setDelta] = useState(500);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const [profiles, h] = await Promise.all([
        db.entities.Profile.list(),
        db.entities.MaintenanceHistory.list("-date", 50),
      ]);
      const prof = profiles[0];
      setProfile(prof);
      setHistory(h);
      if (prof) {
        const maint = currentMaintenance(prof, h).value;
        const w = parseTimeframe(prof.goal_timeframe);
        const gp = goalPacing(maint, prof.goal, prof.goal_amount, w, prof.sex);
        setDelta(gp.recommendedDelta);
      }
      setLoading(false);
    })();
  }, []);

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const maintenance = currentMaintenance(profile, history).value;
  const goalType = profile.goal || "maintain";
  const isLoss = goalType === "lose";
  const isGain = goalType === "gain";
  const verb = isLoss ? "lose" : isGain ? "gain" : "maintain";
  const goalLb = Math.round((profile.goal_amount || 0) * 2.20462);
  const tfLabel = profile.goal_timeframe || "—";
  const DirIcon = isLoss ? TrendingDown : TrendingUp;

  if (goalType === "maintain" || !goalLb) {
    return (
      <ScreenShell eyebrow="Fuel" title="Your goal & pace">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center">
          <p className="text-sm font-light leading-relaxed text-foreground/60">
            You're set to maintain — eat to your maintenance ({maintenance.toLocaleString()} cal/day)
            and let the data do the talking.
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <Link to="/fuel/maintenance" className="text-xs text-foreground/40 transition-colors hover:text-accent">
            ← Back to maintenance
          </Link>
        </div>
      </ScreenShell>
    );
  }

  const weeks = parseTimeframe(profile.goal_timeframe);
  const p = goalPacing(maintenance, goalType, profile.goal_amount, weeks, profile.sex);
  const live = paceAtDelta(maintenance, goalType, profile.goal_amount, delta, profile.sex);

  async function save() {
    setSaving(true);
    try {
      await db.entities.Profile.update(profile.id, { goal_timeframe: labelForWeeks(live.weeks) });
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenShell eyebrow="Fuel" title="Your goal & pace">
      <div className="flex items-center gap-2 text-foreground/60">
        <DirIcon className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <p className="text-sm font-light">
          Goal: {verb} <span className="text-foreground">{goalLb} lbs</span> in{" "}
          <span className="text-foreground">{tfLabel}</span>
        </p>
      </div>

      {/* Implied math — expectation setting */}
      <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">What your goal implies</p>
        <p className="mt-3 text-sm font-light leading-relaxed text-foreground/65">
          Your goal ({verb} {goalLb} lbs in {tfLabel}) would require a{" "}
          <span
            className={`font-mono ${
              p.impliedTooAggressive ? "text-destructive" : "text-foreground"
            }`}
          >
            {p.impliedDelta.toLocaleString()}
          </span>{" "}
          cal/day {isLoss ? "deficit" : "surplus"} vs your maintenance (
          {maintenance.toLocaleString()}).
        </p>
        {p.impliedTooAggressive ? (
          <p className="mt-3 text-xs font-light leading-relaxed text-destructive/80">
            That's outside the healthy range — you'll likely want to readjust your goal.
          </p>
        ) : p.impliedTooSlow ? (
          <p className="mt-3 text-xs font-light leading-relaxed text-foreground/45">
            That's a gentle pace — sustainable, just a little slower than the recommended range.
          </p>
        ) : (
          <p className="mt-3 text-xs font-light leading-relaxed text-accent/80">
            That sits in the healthy range — this is your target.
          </p>
        )}
      </div>

      {/* Healthy plan — recommendation */}
      <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/[0.03] p-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40">Your healthy plan</p>
        <div className="mt-4 flex items-end justify-center gap-2">
          <span className="font-display text-5xl font-extralight leading-none text-accent text-glow">
            {live.target.toLocaleString()}
          </span>
          <span className="mb-1 text-xs text-foreground/45">cal/day target</span>
        </div>
        <p className="mt-4 text-center text-xs font-light leading-relaxed text-foreground/55">
          At {live.effectiveDelta} cal/day {isLoss ? "deficit" : "surplus"}, you'll reach your goal
          in <span className="text-foreground/75">{live.weeks} weeks</span> — around{" "}
          <span className="text-foreground/75">{live.date}</span>.
        </p>

        <div className="mt-7">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-foreground/40">
            <span>{isLoss ? "Deficit" : "Surplus"} cal/day</span>
            <span className="font-mono text-foreground/70">{delta}</span>
          </div>
          <div className="mt-3 px-1">
            <Slider
              value={[delta]}
              min={p.sliderMin}
              max={p.sliderMax}
              step={25}
              onValueChange={(v) => setDelta(v[0])}
            />
          </div>
          <div className="mt-2 flex justify-between text-[9px] tracking-wide text-foreground/30">
            <span>{p.sliderMin}</span>
            <span className="text-accent/60">300–500 recommended</span>
            <span>{p.sliderMax}</span>
          </div>
        </div>

        {live.aggressive && isLoss && (
          <p className="mt-4 text-xs font-light leading-relaxed text-foreground/55">
            Aggressive pace — expect more hunger and fatigue; only sustainable for a larger amount
            to lose.
          </p>
        )}
        {live.floorClamped && (
          <p className="mt-4 text-xs font-light leading-relaxed text-foreground/55">
            Capped to stay above the {p.floor} cal/day floor — going lower isn't safe.
          </p>
        )}
        {isGain && (
          <p className="mt-4 text-xs font-light leading-relaxed text-foreground/45">
            More than 500/day surplus mostly becomes fat, not muscle — so that's the cap. The extra
            just can't be used to build faster.
          </p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="mt-6 w-full rounded-2xl bg-accent py-3.5 text-sm text-primary-foreground glow-sm disabled:opacity-50"
        >
          {saved ? "Saved ✓" : saving ? "Saving…" : "Set this pace"}
        </button>
      </div>

      <div className="mt-8 flex justify-center">
        <Link to="/fuel/maintenance" className="text-xs text-foreground/40 transition-colors hover:text-accent">
          ← Back to maintenance
        </Link>
      </div>
    </ScreenShell>
  );
}